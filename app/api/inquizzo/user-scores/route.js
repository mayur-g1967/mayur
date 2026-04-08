import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import connectDB from "@/lib/db";

export async function POST(req) {
  try {
    await connectDB();
    const user = await authenticate(req);
    const { score, isCorrect } = await req.json();

    await user.updateGameStats(score, isCorrect);

    return NextResponse.json({ 
      message: "Score updated",
      gameStats: user.gameStats 
    });
  } catch (error) {
    console.error("Update score error:", error);
    return NextResponse.json({ message: "Failed to update score" }, { status: 500 });
  }
}