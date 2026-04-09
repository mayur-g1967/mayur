import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import connectDB from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req) {
    try {
        await connectDB();
        console.log("🚀 Session POST request received");

        let decodedUser;
        try {
            decodedUser = await authenticate(req);
            console.log("✅ User authenticated:", decodedUser?.email);
        } catch (authError) {
            console.error("❌ Authentication failed:", authError.message);
            return NextResponse.json(
                { success: false, error: "Unauthorized: " + authError.message },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { score, timeTaken } = body;
        console.log("📦 Request body:", { score, timeTaken });

        if (score === undefined || score === null || timeTaken === undefined || timeTaken === null) {
            return NextResponse.json(
                { success: false, error: "Missing required session parameters (score, timeTaken)" },
                { status: 400 }
            );
        }

        console.log("🔌 Database already connected");

        // Use findOne to get the full user document with all properties
        const user = await User.findById(decodedUser._id);

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found in database" },
                { status: 404 }
            );
        }

        // Initialize stats block if missing
        if (!user.confidenceCoachStats) {
            console.log("🆕 Initializing confidenceCoachStats for user");
            user.confidenceCoachStats = {
                sessionsCompleted: 0,
                voiceTrainingMinutes: 0,
                lastSessionDate: null,
                averageScore: 0
            };
        }

        const stats = user.confidenceCoachStats;
        const oldAvg = stats.averageScore || 0;
        const oldCount = stats.sessionsCompleted || 0;

        let newAvg = ((oldAvg * oldCount) + score) / (oldCount + 1);
        newAvg = Math.round(newAvg * 10) / 10;

        // Manually update the document fields
        user.confidenceCoachStats.averageScore = newAvg;
        user.confidenceCoachStats.sessionsCompleted = oldCount + 1;
        user.confidenceCoachStats.voiceTrainingMinutes += (timeTaken / 60);
        user.confidenceCoachStats.lastSessionDate = new Date();

        console.log("💾 Saving user stats...");
        // Use try-catch specifically for save to capture validation errors
        try {
            await user.save();
            console.log("✅ Session saved successfully");
        } catch (saveError) {
            console.error("❌ Mongoose Save Error:", saveError);
            throw new Error("Failed to save user data: " + saveError.message);
        }

        return NextResponse.json({
            success: true,
            stats: user.confidenceCoachStats
        });

    } catch (error) {
        console.error("❌ Confidence Coach Session Persistence Error:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error: " + error.message },
            { status: 500 }
        );
    }
}
