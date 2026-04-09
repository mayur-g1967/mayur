import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import connectDB from "@/lib/db";
import UserAttempt from "@/models/UserAttempt";


export async function POST(req) {
    try {
        await connectDB();
        const user = await authenticate(req);

        const {

            moduleId = "inQuizzo",
            gameType = "voice",
            sessionId,
            question,
            userAnswer,
            correctAnswer,
            isCorrect,
            score = 0,
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

        // 1. Save the UserAttempt document
        await UserAttempt.create({
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

        // 2. Calculate current session stats to update User model accurately
        const sessionAttempts = await UserAttempt.find({ sessionId, userId: user._id }).lean();
        const currentSessionTotal = sessionAttempts.reduce((sum, att) => sum + att.score, 0);

        // Is this the first question of the session?
        const isFirstInSession = sessionAttempts.length === 1;

        // 3. Update user gameStats
        user.gameStats.totalScore += score;
        user.gameStats.totalQuestions += 1;

        if (isCorrect) {
            user.gameStats.correctAnswers += 1;
        }

        if (isFirstInSession) {
            user.gameStats.gamesPlayed += 1;
        }

        // Update highestScore ONLY if this session total exceeds the previous record
        if (currentSessionTotal > user.gameStats.highestScore) {
            console.log(`🏆 New Personal Best! Session Total: ${currentSessionTotal} (Previous: ${user.gameStats.highestScore})`);
            user.gameStats.highestScore = currentSessionTotal;
        }

        if (user.gameStats.gamesPlayed > 0) {
            user.gameStats.averageScore = Math.round(
                user.gameStats.totalScore / user.gameStats.gamesPlayed
            );
        }

        user.gameStats.lastGameDate = new Date();
        await user.save();

        return NextResponse.json({
            success: true,
            xpEarned: score,
            newTotal: user.gameStats.totalScore,
        });
    } catch (error) {
        console.error("❌ Save attempt error:", error);
        return NextResponse.json(
            { message: "Failed to save attempt", error: error.message },
            { status: 500 }
        );
    }
}
