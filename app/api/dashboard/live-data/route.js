import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import UserAttempt from "@/models/UserAttempt";
import ActiveQuizSession from "@/models/ActiveQuizSession";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import User from "@/models/User";

const buildDateFilter = (start) => ({
    timestamp: { $gte: start }
});

const buildPrevDateFilter = (start, end) => ({
    timestamp: { $gte: start, $lte: end }
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
        const [currentAttemptsRaw, previousAttemptsRaw, activeSession, aggregatedData] = await Promise.all([
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
            ])
        ]);

        // --- Helper: Map raw attempt to legacy session format ---
        const mapAttempt = (a) => ({
            ...a,
            date: format(new Date(a.timestamp), 'yyyy-MM-dd'),
            module: a.moduleId || 'inQuizzo',
            isVoiceQuiz: a.gameType === 'voice'
        });

        const currentSessions = currentAttemptsRaw.map(mapAttempt);
        const previousSessions = previousAttemptsRaw.map(mapAttempt);

        // --- Compatibility Mapping ---
        const currentUniqueSessionIds = new Set(currentSessions.map(s => s.sessionId).filter(Boolean));
        const previousUniqueSessionIds = new Set(previousSessions.map(s => s.sessionId).filter(Boolean));

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

        // --- Module Progress Aggregation ---
        const inQuizzoAttempts = currentSessions.filter(s => s.module === 'inQuizzo');
        const iqCorrect = inQuizzoAttempts.filter(s => s.isCorrect).length;
        const iqTotal = inQuizzoAttempts.length;

        const accuracyProgress = iqTotal > 0 ? Math.round((iqCorrect / iqTotal) * 100) : 0;
        const questionsProgress = Math.min(100, Math.round((iqTotal / 50) * 100)); // Target 50 Qs
        const sessionsProgress = Math.min(100, Math.round((totalSessions / 10) * 100)); // Target 10 sessions

        // Last completed session logic
        const lastCompletedSessionData = aggResult.sessionData?.[0] ? {
            sessionId: aggResult.sessionData[0]._id,
            title: aggResult.sessionData[0].moduleId === 'microLearning' ? 'Micro-Learning Review' : 'Quiz Review',
            progress: 100,
            lastTimestamp: aggResult.sessionData[0].lastTimestamp
        } : null;

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
                moduleId: activeSession.moduleId || 'inQuizzo',
                stage: activeSession.quizState?.stage || null,
                videoId: activeSession.quizState?.videoId || null,
                playlistId: activeSession.quizState?.playlistId || null,
            } : null,
            lastCompletedSession: lastCompletedSessionData,
            moduleProgress: {
                accuracyProgress,
                questionsProgress,
                sessionsProgress,
                // Legacy support
                accuracy: accuracyProgress,
                logic: accuracyProgress
            },
            stats: {
                totalXP: user.gameStats?.totalScore || 0,
                rank: user.gameStats?.rank || "Explorer",
                lessonsCompleted: aggResult.sessionData?.length || 0
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
