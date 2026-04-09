import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import UserAttempt from "@/models/UserAttempt";
import ActiveQuizSession from "@/models/ActiveQuizSession";
import ChatSession from "@/models/chatSession.model";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import User from "@/models/User";

const buildDateFilter = (start) => ({
    timestamp: { $gte: start }
});

const buildPrevDateFilter = (start, end) => ({
    timestamp: { $gte: start, $lte: end }
});

const buildChatDateFilter = (start) => ({
    updatedAt: { $gte: start }
});

const buildChatPrevDateFilter = (start, end) => ({
    updatedAt: { $gte: start, $lte: end }
});

export async function GET(request) {
    try {
        const user = await authenticate(request);
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || 'last7';

        let currentStart = startOfDay(subDays(new Date(), 7));
        let prevStart = startOfDay(subDays(new Date(), 14));
        let prevEnd = endOfDay(subDays(new Date(), 8));

        if (range === 'last30') {
            currentStart = startOfDay(subDays(new Date(), 30));
            prevStart = startOfDay(subDays(new Date(), 60));
            prevEnd = endOfDay(subDays(new Date(), 31));
        } else if (range === 'today') {
            currentStart = startOfDay(new Date());
            prevStart = startOfDay(subDays(new Date(), 1));
            prevEnd = endOfDay(subDays(new Date(), 1));
        }

        const userId = user._id;
        const baseFilter = { userId };

        // --- Fetch all queries in parallel ---
        const [
            currentAttemptsRaw,
            previousAttemptsRaw,
            activeSession,
            aggregatedData,
            currentMentorSessionsRaw,
            previousMentorSessionsRaw
        ] = await Promise.all([
            // Current period attempts
            UserAttempt.find({ ...baseFilter, ...buildDateFilter(currentStart) })
                .select('_id timestamp gameType isCorrect timeTaken sessionId moduleId')
                .sort({ timestamp: -1 })
                .lean(),

            // Previous period attempts
            UserAttempt.find({ ...baseFilter, ...buildPrevDateFilter(prevStart, prevEnd) })
                .select('_id timestamp gameType isCorrect timeTaken sessionId moduleId')
                .sort({ timestamp: -1 })
                .lean(),

            // Active session (if any)
            ActiveQuizSession.findOne({ userId }).lean(),

            UserAttempt.aggregate([
                { $match: baseFilter },
                {
                    $facet: {
                        sessionData: [
                            {
                                $group: {
                                    _id: '$sessionId',
                                    sessionCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                                    sessionCount: { $sum: 1 },
                                    lastTimestamp: { $max: '$timestamp' },
                                    moduleId: { $first: '$moduleId' }
                                }
                            }
                        ],
                        uniqueDates: [
                            {
                                $group: {
                                    _id: {
                                        $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'Asia/Kolkata' }
                                    }
                                }
                            },
                            { $sort: { _id: -1 } }
                        ]
                    }
                }
            ]),

            // Current Social Mentor sessions
            ChatSession.find({ ...baseFilter, ...buildChatDateFilter(currentStart) })
                .select('_id updatedAt sessionId')
                .lean(),

            // Previous Social Mentor sessions
            ChatSession.find({ ...baseFilter, ...buildChatPrevDateFilter(prevStart, prevEnd) })
                .select('_id updatedAt sessionId')
                .lean(),
        ]);

        const mapAttempt = (a) => ({
            ...a,
            date: format(new Date(a.timestamp), 'yyyy-MM-dd'),
            module: a.moduleId || 'inQuizzo',
            isVoiceQuiz: a.gameType === 'voice'
        });

        const mapChatSession = (c) => ({
            _id: c._id,
            timestamp: c.updatedAt,
            date: format(new Date(c.updatedAt), 'yyyy-MM-dd'),
            module: 'socialMentor',
            sessionId: c.sessionId,
            isCorrect: false, // Not applicable for mentors
            isVoiceQuiz: false
        });

        const currentSessions = [
            ...currentAttemptsRaw.map(mapAttempt),
            ...(currentMentorSessionsRaw || []).map(mapChatSession)
        ];

        const previousSessions = [
            ...previousAttemptsRaw.map(mapAttempt),
            ...(previousMentorSessionsRaw || []).map(mapChatSession)
        ];

        // --- Compatibility Mapping ---
        const currentUniqueSessionIds = new Set([
            ...currentAttemptsRaw.map(s => s.sessionId),
            ...(currentMentorSessionsRaw || []).map(s => s.sessionId)
        ].filter(Boolean));

        const previousUniqueSessionIds = new Set([
            ...previousAttemptsRaw.map(s => s.sessionId),
            ...(previousMentorSessionsRaw || []).map(s => s.sessionId)
        ].filter(Boolean));

        const totalSessions = currentUniqueSessionIds.size;
        const prevTotalSessions = previousUniqueSessionIds.size;

        const voiceQuizCount = currentSessions.filter(s => s.isVoiceQuiz && s.module === 'inQuizzo').length;
        const prevVoiceQuizCount = previousSessions.filter(s => s.isVoiceQuiz && s.module === 'inQuizzo').length;

        const aggResult = aggregatedData[0] || {};
        const currentStreak = (aggResult.uniqueDates || []).length;

        const currentTotalCorrect = currentSessions.filter(s => s.isCorrect).length;
        const currentTotalAttempts = currentSessions.length;
        const confidenceScore = currentTotalAttempts > 0 ? Math.round((currentTotalCorrect / currentTotalAttempts) * 100) : 70;

        const prevTotalCorrect = previousSessions.filter(s => s.isCorrect).length;
        const prevTotalAttempts = previousSessions.length;
        const prevConfidenceScore = prevTotalAttempts > 0 ? Math.round((prevTotalCorrect / prevTotalAttempts) * 100) : 70;

        // --- Robust Statistics Aggregation (Range source of truth matching InQuizzo page) ---
        let statsStart = new Date();
        if (range === 'today') {
            statsStart.setHours(statsStart.getHours() - 24);
        } else if (range === 'last30') {
            statsStart.setDate(statsStart.getDate() - 30);
        } else {
            statsStart.setDate(statsStart.getDate() - 7);
        }

        const statsAgg = await UserAttempt.aggregate([
            { $match: { userId: user._id, moduleId: 'inQuizzo', timestamp: { $gte: statsStart } } },
            {
                $group: {
                    _id: "$sessionId",
                    sessionScore: { $sum: "$score" },
                    sessionCorrect: { $sum: { $cond: ["$isCorrect", 1, 0] } },
                    sessionCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: "$sessionCount" },
                    correct: { $sum: "$sessionCorrect" },
                    totalScore: { $sum: "$sessionScore" },
                    totalSessions: { $sum: 1 }
                }
            }
        ]);

        const rangeData = statsAgg[0] || { count: 0, correct: 0, totalScore: 0, totalSessions: 0 };
        const rangeCount = rangeData.count;
        const rangeCorrect = rangeData.correct;
        const rangeScore = rangeData.totalScore;

        const accuracyProgress = rangeCount > 0
            ? Math.round((rangeCorrect / rangeCount) * 100)
            : 0;

        const questionsProgress = Math.min(100, Math.round((rangeCount / 100) * 100));

        // Cap the visual progress bar for score at an arbitrary value (e.g. 5000), but show exact score in label
        const scoreProgress = Math.min(100, Math.round((rangeScore / 5000) * 100));

        // Social Mentor session count logic
        let smCount = 0;
        if (currentMentorSessionsRaw) {
            const uniqueSmIds = new Set(currentMentorSessionsRaw.map(s => s.sessionId).filter(Boolean));
            smCount = uniqueSmIds.size;
        }

        // Last completed session logic
        const lastSessionRaw = aggResult.sessionData?.[0];
        const lastCompletedSessionData = lastSessionRaw ? {
            sessionId: lastSessionRaw._id,
            title: lastSessionRaw.moduleId?.toLowerCase() === 'microlearning' ? 'Micro-Learning Review' : 'Quiz Review',
            progress: 100,
            lastTimestamp: lastSessionRaw.lastTimestamp
        } : null;

        // --- Tags for Main Metric Cards ---
        let questsTag = "";
        let accuracyTag = "";

        if (range === 'today') {
            questsTag = "Today";
            accuracyTag = "Today";
        } else if (range === 'last7') {
            questsTag = "Last 7 Days";
            accuracyTag = "Last 7 Days";
        } else {
            questsTag = "Last 30 Days";
            accuracyTag = "Last 30 Days";
        }

        return NextResponse.json({
            success: true,
            currentSessions,
            previousSessions,
            voiceQuizCount,
            prevVoiceQuizCount,
            currentStreak,
            confidenceScore,
            prevConfidenceScore,
            totalSessions,
            prevTotalSessions,
            activeSession: activeSession ? {
                id: activeSession._id,
                sessionId: activeSession.sessionId || activeSession._id,
                title: activeSession.title || (activeSession.moduleId === 'microLearning' ? 'Micro-Learning' : 'In-Progress Challenge'),
                progress: activeSession.questionsAnswered || 0,
                startTime: activeSession.startTime,
                moduleId: activeSession.moduleId || 'inquizzo',
                stage: activeSession.quizState?.stage || null,
                videoId: activeSession.quizState?.videoId || null,
                playlistId: activeSession.quizState?.playlistId || null,
            } : null,
            lastCompletedSession: lastCompletedSessionData,
            moduleProgress: {
                accuracyProgress,
                questionsProgress,
                scoreProgress,
                socialMentorSessionsVal: smCount,
                socialMentorSessionsProgress: Math.min(100, Math.round((smCount / 20) * 100)), // arbitrary cap
                // Display labels for the UI
                accuracyLabel: `${accuracyProgress}% Accuracy`,
                questionsLabel: `${rangeCount} Questions`,
                scoreLabel: `${rangeScore} Pts`,
                socialMentorSessionsLabel: `${smCount} Sessions`,
                // Legacy support
                accuracy: accuracyProgress,
                logic: accuracyProgress
            },
            stats: {
                questsAnswered: rangeCount,
                accuracyRate: accuracyProgress,
                questsChangeTag: questsTag,
                accuracyTag: accuracyTag,
                totalXP: user.gameStats?.totalScore || 0,
                rank: user.gameStats?.rank || "Explorer",
                lessonsCompleted: rangeData.totalSessions || 0
            }
        });

    } catch (error) {
        console.error("Dashboard Live Data Error:", error);
        return NextResponse.json({
            success: false,
            message: "Failed to fetch dashboard data"
        }, { status: 500 });
    }
}
