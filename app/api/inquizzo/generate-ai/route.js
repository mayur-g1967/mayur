import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import connectDB from "@/lib/db";
import { runGroqAction } from "@/lib/ai-handler";

export async function POST(req) {
  try {
    await connectDB();
    const user = await authenticate(req);
    const { category, difficulty, count } = await req.json();

    const prompt = `Generate ${count} ${difficulty} difficulty ${category} quiz questions in JSON format:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":"A","explanation":"..."}]`;

    const completion = await runGroqAction((groq, model) =>
      groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: model,
        temperature: 0.7,
      })
    );

    const questions = JSON.parse(completion.choices[0]?.message?.content || "[]");

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Generate AI error:", error);
    return NextResponse.json({ message: "Failed to generate questions: " + error.message }, { status: 500 });
  }
}