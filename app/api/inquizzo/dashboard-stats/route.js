import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import connectDB from "@/lib/db";
import UserAttempt from "@/models/UserAttempt";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req) {
    try {
        await connectDB();
        const user = await authenticate(req);

        if (!user) {
            console.error("❌ Stats Error: User not authenticated");
            return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
        }

        const userId = new mongoose.Types.ObjectId(user._id);
        console.log(`📊 Fetching stats for user: ${user.username} (${userId})`);

        // Extract range from query params
        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || 'last7';

        // Calculate date filter
        let dateFilter = {};
        const now = new Date();
        if (range === 'today') {
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
            dateFilter = { timestamp: { $gte: twentyFourHoursAgo } };
        } else if (range === 'last7') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            dateFilter = { timestamp: { $gte: sevenDaysAgo } };
        } else if (range === 'last30') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            dateFilter = { timestamp: { $gte: thirtyDaysAgo } };
        }

        const matchCriteria = {
            userId: userId,
            moduleId: 'inQuizzo',
            ...dateFilter
        };

        // 1. Fetch InQuizzo specific attempts for recent activity
        const recentActivity = await UserAttempt.find(matchCriteria)
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();

        console.log(`✅ Found ${recentActivity.length} recent attempts for range ${range}`);

        // 2. Aggregate stats from UserAttempt records with session-awareness
        const statsAggregation = await UserAttempt.aggregate([
            { $match: matchCriteria },
            {
                // Group by session first to get session-level totals (for highest score)
                $group: {
                    _id: "$sessionId",
                    sessionScore: { $sum: "$score" },
                    sessionCorrect: { $sum: { $cond: ["$isCorrect", 1, 0] } },
                    sessionCount: { $sum: 1 }
                }
            },
            {
                // Group all the session totals to get final dashboard stats
                $group: {
                    _id: null,
                    totalScore: { $sum: "$sessionScore" },
                    questsAnswered: { $sum: "$sessionCount" },
                    correctAnswers: { $sum: "$sessionCorrect" },
                    highestSessionScore: { $max: "$sessionScore" },
                    totalSessions: { $sum: 1 }
                }
            }
        ]);

        console.log("📈 Aggregation result (session-aware):", JSON.stringify(statsAggregation));

        const aggregated = statsAggregation[0] || {
            totalScore: 0,
            questsAnswered: 0,
            correctAnswers: 0,
            highestSessionScore: 0,
            totalSessions: 0
        };

        // Calculate accuracy rate logic
        const accuracyRate = aggregated.questsAnswered > 0
            ? Math.round((aggregated.correctAnswers / aggregated.questsAnswered) * 100)
            : 0;

        // 3. Auto-Repair / Sync All-Time User Stats
        // Since a previous bug might have overwritten gameStats with filtered stats,
        // we do an UNFILTERED aggregation to ensure the user's lifetime stats are always accurate.
        const allTimeAggregation = await UserAttempt.aggregate([
            { $match: { userId: userId, moduleId: 'inQuizzo' } },
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
                    totalScore: { $sum: "$sessionScore" },
                    questsAnswered: { $sum: "$sessionCount" },
                    correctAnswers: { $sum: "$sessionCorrect" },
                    highestSessionScore: { $max: "$sessionScore" },
                    totalSessions: { $sum: 1 }
                }
            }
        ]);

        const allTimeStats = allTimeAggregation[0] || {
            totalScore: 0,
            questsAnswered: 0,
            correctAnswers: 0,
            highestSessionScore: 0,
            totalSessions: 0
        };

        if (!user.gameStats) {
            user.gameStats = { totalScore: 0, gamesPlayed: 0, correctAnswers: 0, totalQuestions: 0, highestScore: 0, averageScore: 0 };
        }

        const needsRepair =
            user.gameStats.totalScore !== allTimeStats.totalScore ||
            user.gameStats.totalQuestions !== allTimeStats.questsAnswered ||
            (allTimeStats.highestSessionScore > 0 && allTimeStats.highestSessionScore > user.gameStats.highestScore);

        if (needsRepair) {
            console.log("🔄 Repairing/Syncing lifetime gameStats to User model...");
            user.gameStats.totalScore = allTimeStats.totalScore;
            user.gameStats.totalQuestions = allTimeStats.questsAnswered;
            user.gameStats.correctAnswers = allTimeStats.correctAnswers;
            user.gameStats.gamesPlayed = allTimeStats.totalSessions;

            if (allTimeStats.highestSessionScore > user.gameStats.highestScore) {
                user.gameStats.highestScore = allTimeStats.highestSessionScore;
            }

            if (user.gameStats.gamesPlayed > 0) {
                user.gameStats.averageScore = Math.round(user.gameStats.totalScore / user.gameStats.gamesPlayed);
            }

            await user.save();
            console.log("✅ Lifetime stats repair complete");
        }

        let scoreTag = "";
        let questsTag = "";
        let accuracyTag = "";
        let highestTag = "";

        if (range === 'today') {
            scoreTag = `+${aggregated.totalScore} today`;
            questsTag = `+${aggregated.questsAnswered} today`;
            accuracyTag = aggregated.questsAnswered > 0 ? "Daily Average" : "No Data Today";
            highestTag = "All Time Best";
        } else if (range === 'last7') {
            scoreTag = `+${aggregated.totalScore} this week`;
            questsTag = `+${aggregated.questsAnswered} this week`;
            accuracyTag = aggregated.questsAnswered > 0 ? "Weekly Average" : "No Data this Week";
            highestTag = "All Time Best";
        } else {
            scoreTag = `+${aggregated.totalScore} this month`;
            questsTag = `+${aggregated.questsAnswered} this month`;
            accuracyTag = aggregated.questsAnswered > 0 ? "Monthly Average" : "No Data this Month";
            highestTag = "All Time Best";
        }

        return NextResponse.json({
            stats: {
                totalScore: aggregated.totalScore,
                scoreChangeTag: scoreTag,
                questsAnswered: aggregated.questsAnswered,
                questsChangeTag: questsTag,
                accuracyRate: accuracyRate,
                accuracyTag: accuracyTag,
                highestScore: user.gameStats.highestScore, // Use the one in user stats as it might include non-attempt based records if any
                highestTag: highestTag
            },
            recentActivity: recentActivity.map(item => ({
                name: item.question.substring(0, 40) + (item.question.length > 40 ? '...' : ''),
                topic: item.difficulty, // Placeholder as 'topic' isn't explicitly in UserAttempt but difficulty is
                score: item.score,
                date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                status: item.isCorrect ? 'Completed' : 'Failed', // Simplified status mapping
                type: item.gameType || 'quiz'
            }))
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        return NextResponse.json(
            { message: error.message || "Failed to fetch dashboard stats" },
            { status: error.message === "No token provided" ? 401 : 500 }
        );
    }
}
