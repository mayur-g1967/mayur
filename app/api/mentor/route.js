import { Groq } from 'groq-sdk';
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import UserAttempt from "@/models/UserAttempt";
import User from "@/models/User";
import { getGroqChain, isKeyRateLimited, markKeyRateLimited } from "@/lib/ai-handler";

// ── Auth helper ───────────────────────────────────────────────────────────────
function getUserFromToken(req) {
    try {
        const authHeader = req.headers.get("authorization") || "";
        const token = authHeader.replace("Bearer ", "").trim();
        if (!token) return null;
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

export async function POST(req) {
    try {
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY || 'dummy-key-for-build'
        });

        // Parse request body
        const { messages, sessionId, timeTaken = 0 } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return Response.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        // Convert messages to Groq format
        const groqMessages = [
            {
                role: "system",
                content: `You are a warm, extremely friendly, and supportive Social Mentor. You speak like a wise older friend—approachable, kind, and deeply helpful.

CORE PRINCIPLES:
- DYNAMIC LENGTH: 
  * For simple greetings (e.g., "Hi", "Hello", "Hey"), respond with ONE extremely brief, cheerful sentence (e.g., "Hi there! How can I help you today?").
  * For deep or important social questions (e.g., conflict, anxiety, friendship issues), provide detailed, thoughtful, and high-value information. 
- FRIENDLINESS: Use a very warm and human tone. Make the user feel heard and supported.
- NO FLUFF: Even when providing detail, avoid generic repetitive icebreakers. Get straight to the wisdom.

CRITICAL FORMATTING:
- DO NOT use bullet points or asterisks (*). 
- DO NOT use excessive bolding.
- Write in natural, flowing, and friendly paragraphs.

STRUCTURE (For complex social scenarios):
1. Acknowledge with genuine warmth and empathy (1-2 sentences).
2. Provide informative context-appropriate phrases or advice. Provide clear "Options" (labeled "Option 1", "Option 2") to help the user choose.
3. End with ONE very practical, encouraging tip.

Make your entire response feel like a real conversation with a friend who truly cares.`
            },
            ...messages
                .filter(msg => msg.text && msg.text.trim())
                .map(msg => ({
                    role: msg.role === 'ai' ? 'assistant' : msg.role,
                    content: msg.text
                }))
        ];

        const keys = getGroqChain();
        const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
        let chatCompletion = null;

        for (let m = 0; m < models.length; m++) {
            const model = models[m];
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i].trim();
                if (!key) continue;

                if (isKeyRateLimited(key, model)) {
                    continue; // Instantly skip exhausted keys
                }

                const groq = new Groq({ apiKey: key });

                try {
                    // Create streaming chat completion
                    chatCompletion = await groq.chat.completions.create({
                        messages: groqMessages,
                        model: model,
                        temperature: 0.7,
                        max_completion_tokens: 1024,
                        top_p: 1,
                        stream: true,
                        stop: null
                    });

                    // If successful, break out of both loops
                    break;
                } catch (error) {
                    const status = error.status || error.response?.status;
                    const message = error.message || "";

                    if (status === 429 || message.toLowerCase().includes("rate limit")) {
                        console.warn(`⚠️ [Mentor Groq Key ${i} | ${model}] failed: ${message} -> Marking Exhausted & Trying NEXT KEY...`);
                        markKeyRateLimited(key, model, message);
                        continue;
                    } else if (status === 401) {
                        console.warn(`⚠️ [Mentor Groq Key ${i} | ${model}] Auth Error -> Skipping key...`);
                        markKeyRateLimited(key, model, "try again in 24h");
                        continue;
                    } else if (status === 400 && message.toLowerCase().includes("decommissioned")) {
                        console.warn(`⚠️ [Mentor Groq Key ${i} | ${model}] decommissioned -> Trying NEXT MODEL...`);
                        break;
                    } else {
                        console.warn(`⚠️ [Mentor Groq Key ${i} | ${model}] unknown error: ${message}`);
                        continue;
                    }
                }
            }
            if (chatCompletion) break; // Break outer loop if we got a completion stream
        }

        if (!chatCompletion) {
            throw new Error("All Groq keys and models exhausted for Mentor Stream.");
        }

        // Save session to DB (best-effort, non-blocking)
        const decoded = getUserFromToken(req);
        if (decoded?.userId && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            saveSessionAsync(decoded, lastMessage, sessionId, timeTaken).catch((err) =>
                console.error("[mentor] Failed to save UserAttempt:", err)
            );
        }

        // Create streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of chatCompletion) {
                        const content = chunk.choices[0]?.delta?.content || '';
                        if (content) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (error) {
                    console.error('Stream error:', error);
                    controller.error(error);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
            },
        });


    } catch (error) {
        console.error('API Error:', error);
        return Response.json(
            {
                error: error.message || 'Internal server error',
                details: error.toString()
            },
            { status: 500 }
        );
    }
}

// ── Async session saver (fire-and-forget) ─────────────────────────────────────
async function saveSessionAsync(decoded, lastMessage, sessionId, timeTaken) {
    await connectDB();

    const user = await User.findById(decoded.userId).select("username mentorStats");
    if (!user) return;

    await UserAttempt.create({
        userId: user._id,
        username: user.username,
        moduleId: "socialMentor",
        sessionId: sessionId || `mentor_${Date.now()}`,
        gameType: "chat",
        question: lastMessage.text,
        userAnswer: lastMessage.text,
        correctAnswer: "",
        isCorrect: true,
        score: 5,
        maxPossibleScore: 10,
        timeTaken: timeTaken,
    });

    user.mentorStats.sessionsAttended += 1;
    user.mentorStats.lastSessionDate = new Date();
    await user.save();
}
