import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import connectDB from "@/lib/db";
import UserAttempt from "@/models/UserAttempt";

export async function POST(req) {
    try {
        await connectDB();
        const user = await authenticate(req);

        if (!user) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const {
            moduleId = "microLearning",
            gameType = "mcq",
            sessionId,
            question,
            userAnswer,
            correctAnswer,
            isCorrect,
            score = 1,
            difficulty = "medium",
            timeTaken = 0,
        } = await req.json();

        // Validate required fields
        if (!sessionId || !question || userAnswer === undefined || correctAnswer === undefined || isCorrect === undefined) {
            return NextResponse.json(
                { message: "Missing required fields: sessionId, question, userAnswer, correctAnswer, isCorrect" },
                { status: 400 }
            );
        }

        console.log("📝 Creating UserAttempt document...");
        // 1. Save the UserAttempt document
        const newAttempt = await UserAttempt.create({
            moduleId,
            userId: user._id,
            username: user.username,
            sessionId,
            gameType,
            question,
            userAnswer,
            correctAnswer,
            isCorrect,
            score,
            difficulty,
            timeTaken,
        });

        // 2. Update user gameStats
        user.gameStats.totalScore += score;
        user.gameStats.totalQuestions += 1;

        if (isCorrect) {
            user.gameStats.correctAnswers += 1;
        }

        // Check if this is a new session for this user to increment gamesPlayed
        const otherAttemptsInSession = await UserAttempt.countDocuments({
            sessionId,
            userId: user._id,
            _id: { $ne: null } // We just created one, so it's at least 1
        });

        if (otherAttemptsInSession === 1) {
            user.gameStats.gamesPlayed += 1;
        }

        if (user.gameStats.gamesPlayed > 0) {
            user.gameStats.averageScore = Math.round(
                user.gameStats.totalScore / user.gameStats.gamesPlayed
            );
        }

        user.gameStats.lastGameDate = new Date();
        await user.save();

        console.log("✅ UserAttempt saved and user stats updated.");

        return NextResponse.json({
            success: true,
            xpEarned: score,
            newTotal: user.gameStats.totalScore,
        });
    } catch (error) {
        console.error("❌ Save micro-learning attempt error:", error);
        return NextResponse.json(
            { message: "Failed to save attempt", error: error.message },
            { status: 500 }
        );
    }
}
