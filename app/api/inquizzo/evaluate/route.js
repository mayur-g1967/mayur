import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authenticate } from "@/lib/auth";
import stringSimilarity from "string-similarity";
import connectDB from "@/lib/db";
import { runGroqAction } from "@/lib/ai-handler";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "", maxRetries: 0 });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    await connectDB();
    const user = await authenticate(req);

    const { userAnswer, question, correctAnswer: originalCorrectAnswer, timeTaken } = await req.json();

    const prompt = `Question: ${question}
Expected Correct Answer: ${originalCorrectAnswer || "(not provided)"}
User Answer: ${userAnswer}

Evaluate if the user's answer is correct. Compare against the expected correct answer above.
Be lenient: if the user got the core concept right but phrased it differently, mark isCorrect: true.

Respond ONLY in JSON with the following structure:
{
  "isCorrect": true/false, 
  "explanation": "A detailed 4-5 sentence educational explanation about the topic/answer. Do NOT mention 'the user', 'your answer', or 'the user's answer'. Focus entirely on the subject matter and why the answer is what it is."
}`;

    // Race AI evaluation using Multi-Key Chain vs OpenAI vs Gemini
    const aiPromises = [];

    // 1. Groq Promise
    const groqPromise = (async () => {
      const completion = await runGroqAction((groq, model) =>
        groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: model,
          temperature: 0.3,
        })
      );
      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Groq empty");
      return content;
    })();
    aiPromises.push(groqPromise);

    // 2. OpenAI Promise
    const openAIPromise = (async () => {
      try {
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o",
          temperature: 0.3,
          response_format: { type: "json_object" },
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("OpenAI empty");
        return content;
      } catch (err) {
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          temperature: 0.3,
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("OpenAI backup empty");
        return content;
      }
    })();
    aiPromises.push(openAIPromise);

    // 3. Gemini Promise
    const geminiPromise = (async () => {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const content = result.response.text();
        if (!content) throw new Error("Gemini empty");
        return content;
      } catch (err) {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent(prompt);
        const content = result.response.text();
        if (!content) throw new Error("Gemini lite empty");
        return content;
      }
    })();
    aiPromises.push(geminiPromise);

    let evaluationText;
    try {
      evaluationText = await Promise.any(aiPromises);
    } catch (aggregateError) {
      console.error("All AI evaluators failed:", aggregateError.errors);
      throw new Error("All evaluation models failed");
    }

    // Helper to extract JSON from potentially markdown-wrapped evaluation
    const extractJSON = (text) => {
      try { return JSON.parse(text); } catch {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) return JSON.parse(match[1].trim());
        const jsonMatch = text.match(/\{[\s\S]*"isCorrect"[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return {};
      }
    };

    const evaluation = extractJSON(evaluationText || "{}");

    // Use the ORIGINAL correct answer from question generation, not AI's guess
    const authoritative = originalCorrectAnswer || evaluation.correctAnswer || "";

    // Calculate similarity score against the authoritative correct answer
    const similarity = stringSimilarity.compareTwoStrings(
      userAnswer.toLowerCase(),
      authoritative.toLowerCase()
    );

    // Hybrid Scoring:
    // 1. If AI says isCorrect: 7-15 points based on similarity
    // 2. If AI says incorrect but similarity is high (>0.5): 1-6 partial points
    // 3. Otherwise: 0 points
    let score = 0;
    if (evaluation.isCorrect) {
      score = Math.round(7 + (similarity * 8));
      score = Math.min(score, 15);
    } else if (similarity > 0.5) {
      // Partial credit for high similarity despite AI marking incorrect
      score = Math.round(similarity * 6);
      console.log(`💡 Partial points awarded based on similarity (${Math.round(similarity * 100)}%): ${score}`);
    }

    // We no longer update stats here as it's double counting. 
    // RandomQuiz calls /api/inquizzo/attempt separately to save the record and update stats.

    console.log("-----------------------------------------");
    console.log(`📊 EVALUATION [Score: ${score}/15]:`);
    console.log(`❓ Q: ${question}`);
    console.log(`👤 User: ${userAnswer}`);
    console.log(`✅ Correct: ${authoritative}`);
    console.log(`🎯 Similarity: ${Math.round(similarity * 100)}%`);
    console.log(`📢 Feedback: ${evaluation.explanation}`);
    console.log("-----------------------------------------");

    return NextResponse.json({
      result: {
        isCorrect: evaluation.isCorrect,
        correctAnswer: authoritative,
        explanation: evaluation.explanation,
        feedback: evaluation.explanation,
        similarity: Math.round(similarity * 100),
        score,
      },
      userStats: {
        totalScore: user.gameStats.totalScore,
        gamesPlayed: user.gameStats.gamesPlayed,
        accuracy: user.accuracy,
      },
    });
  } catch (error) {
    console.error("Evaluate answer error:", error);
    return NextResponse.json(
      { message: "Failed to evaluate answer: " + error.message },
      { status: 500 }
    );
  }
}
