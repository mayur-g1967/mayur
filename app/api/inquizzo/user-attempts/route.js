import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import User from "@/models/User";
import connectDB from "@/lib/db";

export async function POST(req) {
  try {
    await connectDB();
    const user = await authenticate(req);
    const { questionId } = await req.json();

    if (!user.seenQuestions.includes(questionId)) {
      user.seenQuestions.push(questionId);
      await user.save();
    }

    return NextResponse.json({ message: "Question marked as seen" });
  } catch (error) {
    console.error("Mark seen error:", error);
    return NextResponse.json({ message: "Failed to mark question" }, { status: 500 });
  }
}