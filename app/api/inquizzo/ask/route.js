import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authenticate } from "@/lib/auth";
import connectDB from "@/lib/db";
import { runGroqAction } from "@/lib/ai-handler";
import FallbackQuestion from "@/models/FallbackQuestion";

// Initialize OpenAI and Gemini
console.log("🛠️ Initializing secondary AI clients...");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "", maxRetries: 0 });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Helper to extract JSON from potentially markdown-wrapped responses
function extractJSON(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try {
        return JSON.parse(match[1].trim());
      } catch (e) {
        console.warn("⚠️ Failed to parse markdown block JSON, trying regex...");
      }
    }
    const jsonMatch = text.match(/\{[\s\S]*"question"[\s\S]*"answer"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error("Could not parse extracted JSON object pattern");
      }
    }
    throw new Error("Could not extract JSON from AI response: " + text.substring(0, 100));
  }
}

export async function POST(req) {
  try {
    console.log("📥 Received request for quiz question...");
    await connectDB();
    const user = await authenticate(req);
    console.log("✅ User authenticated:", user.email);

    const body = await req.json();
    const {
      topic = "general knowledge",
      subject = null,
      category = null,
      subCategory = null,
      seenQuestions = []
    } = body;

    // Bulletproof difficulty
    const difficultyLevel = (typeof body.difficulty === "string" ? body.difficulty : "medium").toUpperCase();

    const contextParts = [subject, category, subCategory, topic].filter(Boolean);
    const selectedTopic = contextParts.length > 0 ? contextParts.join(" > ") : (topic || "general knowledge");

    const difficultyDescriptions = {
      easy: "simple, basic factual, one-line answers",
      medium: "intermediate, concepts, categories, comparisons",
      hard: "advanced, deep dives, real-world challenges, complex problem solving",
    };
    const difficultyLabel = difficultyDescriptions[difficultyLevel.toLowerCase()] || difficultyDescriptions.medium;

    // Only send SHORT snippets of recent questions to avoid blowing up the token count.
    // Groq free tier has 6000 TPM — sending 150 full questions used ~4600 tokens per request!
    // Increase buffer to help AI avoid repeats
    const recentSeen = Array.isArray(seenQuestions) ? seenQuestions.slice(-50) : [];
    let avoidClause = "";
    if (recentSeen.length > 0) {
      // Truncate each question to first 60 chars to minimize tokens
      const shortList = recentSeen.map((q, i) => `${i + 1}. ${String(q).substring(0, 60)}`).join("\n");
      avoidClause = `\nCRITICAL: Do NOT repeat any of these recent questions:\n${shortList}\n\nYou MUST generate a completely unique and novel challenge.`;
    }

    const rngSeed = Math.floor(Math.random() * 1000000);
    const prompt = `Generate ONE unique quiz question about "${selectedTopic}". Difficulty: ${difficultyLevel}.
Rules: Return ONLY valid JSON: {"question":"...","answer":"..."}
Be creative and original. Seed: ${rngSeed}.
${avoidClause}`;

    // Race top AI providers to get the fastest response
    const aiPromises = [];

    // 1. Groq Promise (Fastest usually)
    const groqPromise = (async () => {
      console.log("🏁 Racing: Groq Multi-Key Chain...");
      const completion = await runGroqAction((groq, model) =>
        groq.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: model,
          temperature: 0.7,
        })
      );
      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("Groq returned empty content");
      return { content, source: "Groq (llama)" };
    })();
    aiPromises.push(groqPromise);

    // 2. OpenAI Promise (gpt-4o / gpt-3.5-turbo backup)
    const openAIPromise = (async () => {
      console.log("🏁 Racing: OpenAI (gpt-4o)...");
      try {
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o",
          temperature: 0.7,
          response_format: { type: "json_object" },
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("empty");
        return { content, source: "OpenAI (gpt-4o)" };
      } catch (err) {
        console.log("🏁 Racing: OpenAI (gpt-3.5-turbo)...");
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-3.5-turbo",
          temperature: 0.7,
        });
        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error("OpenAI returned empty content");
        return { content, source: "OpenAI (gpt-3.5-turbo)" };
      }
    })();
    aiPromises.push(openAIPromise);

    // 3. Gemini Promise (2.0-flash with fallback to 2.0-flash-lite)
    const geminiPromise = (async () => {
      try {
        console.log("🏁 Racing: Gemini (2.0-flash)...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        const content = result.response.text();
        if (!content) throw new Error("Gemini returned empty content");
        return { content, source: "Gemini (2.0-flash)" };
      } catch (err) {
        console.log("🏁 Gemini 2.0-flash failed, trying gemini-2.0-flash-lite...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const result = await model.generateContent(prompt);
        const content = result.response.text();
        if (!content) throw new Error("Gemini lite returned empty content");
        return { content, source: "Gemini (2.0-flash-lite)" };
      }
    })();
    aiPromises.push(geminiPromise);

    let bestResult;
    try {
      bestResult = await Promise.any(aiPromises);
      console.log(`🏆 Race winner: ${bestResult.source}`);
    } catch (aggregateError) {
      console.warn("🔻 EMERGENCY: All AI services failed in the race. Fetching from database fallback.");

      try {
        // Try to get a random fallback question from DB for requested difficulty
        const [dbFallback] = await FallbackQuestion.aggregate([
          { $match: { difficulty: difficultyLevel.toLowerCase() } },
          { $sample: { size: 1 } }
        ]);

        if (dbFallback) {
          console.log(`✅ Success: Retreived ${difficultyLevel} fallback from database.`);
          return NextResponse.json({
            question: dbFallback.question,
            answer: dbFallback.answer,
            user: { username: user.username },
            source: "Database Fallback Pool",
            version: "V8_RACE_CONCURRENT"
          });
        }
      } catch (dbErr) {
        console.error("❌ Database fallback fetch failed:", dbErr.message);
      }

      console.warn("⚠️ Database fallback failed or empty. Using static pool last-resort.");
      const staticPool = [
        { question: "What is the capital of France?", answer: "Paris" },
        { question: "Who developed the theory of relativity?", answer: "Albert Einstein" },
        { question: "What is the largest planet in our solar system?", answer: "Jupiter" },
        { question: "Which element has the chemical symbol 'O'?", answer: "Oxygen" },
        { question: "What is the power house of the cell?", answer: "Mitochondria" }
      ];
      const randomQ = staticPool[Math.floor(Math.random() * staticPool.length)];
      return NextResponse.json({
        ...randomQ,
        user: { username: user.username },
        source: "Emergency Static Pool",
        version: "V8_RACE_CONCURRENT"
      });
    }

    const { content, source } = bestResult;

    const parsed = extractJSON(content);

    console.log("-----------------------------------------");
    console.log(`📝 GENERATED QUIZ [${source || "Race Winner"}]:`);
    console.log(`❓ Q: ${parsed.question}`);
    console.log(`💡 A: ${parsed.answer}`);
    console.log("-----------------------------------------");

    return NextResponse.json({
      question: parsed.question || "Fallback: What is the capital of India?",
      answer: parsed.answer || "New Delhi",
      user: { username: user.username },
      source: source || "Race Winner",
      version: "V8_RACE_CONCURRENT"
    });

  } catch (error) {
    console.error("❌ FINAL API ERROR:", error.message);
    return NextResponse.json({
      message: error.message,
      version: "V8_RACE_CONCURRENT",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    }, { status: 503 });
  }
}
