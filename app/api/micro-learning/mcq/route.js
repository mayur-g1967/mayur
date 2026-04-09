import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY_3 || process.env.GROQ_API_KEY || 'dummy-key-for-build' });

// In-memory cache with TTL (1 hour)
const quizCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in ms

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of quizCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      quizCache.delete(key);
    }
  }
}, 15 * 60 * 1000); // every 15 minutes

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ success: false, message: 'Missing videoId parameter' }, { status: 400 });
  }

  const cached = quizCache.get(videoId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[MCQ GET] Cache hit for ${videoId} (${cached.mcqs.length} questions)`);
    return NextResponse.json({ success: true, mcqs: cached.mcqs });
  }

  return NextResponse.json({ success: false, message: 'No valid cached MCQs found for this video' });
}

export async function POST(req) {
  try {
    const { segments, videoId } = await req.json();

    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid or missing segments array' }, { status: 400 });
    }

    // ────────────────────────────────────────────────
    // Build rich context (prefer context → fallback to text)
    // ────────────────────────────────────────────────
    const knowledgeSource = segments
      .map(s => {
        if (typeof s === 'string') return s.trim();
        return s.context?.trim() || s.text?.trim() || '';
      })
      .filter(Boolean)
      .join('\n\n───\n\n') // clear section dividers
      .substring(0, 48000); // safe limit for Groq context

    if (knowledgeSource.length < 200) {
      console.warn('[MCQ] Insufficient content length:', knowledgeSource.length);
      return NextResponse.json({ success: false, message: 'Content too short for meaningful assessment' }, { status: 400 });
    }

    console.log(`[MCQ POST] Video: ${videoId || 'unknown'} | Input chars: ${knowledgeSource.length} | Segments: ${segments.length}`);

    // ────────────────────────────────────────────────
    // Powerful, strict system prompt
    // ────────────────────────────────────────────────
    const systemPrompt = `
You are an elite academic assessment designer. Your task is to create exactly 8 high-quality, diverse, and challenging multiple-choice questions (MCQs) based ONLY on the provided content.

STRICT RULES:
- Generate EXACTLY 8 questions — no more, no less.
- Questions must be DISTINCT and cover different aspects: definitions, examples, mechanisms, implications, applications, comparisons, edge cases, misconceptions.
- NO repetition of ideas or rephrased versions of the same question.
- Difficulty: intermediate to advanced — avoid trivial or obvious questions.
- Each question MUST include:
  - "question": clear, precise question text
  - "options": array of exactly 4 plausible strings (distractors must be believable)
  - "answer": the EXACT correct option string (must match one in "options" character-for-character)
  - "explanation": 1–2 clear sentences explaining why it's correct and why others are wrong

Output format — ONLY valid JSON, nothing else:
{
  "mcqs": [
    { "question": "...", "options": ["...", "...", "...", "..."], "answer": "...", "explanation": "..." },
    ...
  ]
}

Now generate based on this content:
`.trim();

    // ────────────────────────────────────────────────
    // Call Groq with retry logic
    // ────────────────────────────────────────────────
    let completion = null;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries && !completion) {
      try {
        completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: knowledgeSource }
          ],
          model: 'llama-3.3-70b-versatile', // best balance of quality + speed on Groq
          temperature: 0.65,                // good creativity without chaos
          max_tokens: 2048,
          top_p: 0.9,
          response_format: { type: 'json_object' },
        });
      } catch (groqErr) {
        retryCount++;
        console.warn(`[MCQ] Groq attempt ${retryCount} failed:`, groqErr.message);
        if (retryCount > maxRetries) throw groqErr;
        await new Promise(r => setTimeout(r, 1500 * retryCount)); // exponential backoff
      }
    }

    if (!completion?.choices?.[0]?.message?.content) {
      throw new Error('No valid response received from Groq');
    }

    const rawResponse = completion.choices[0].message.content;
    console.log('[MCQ] Raw Groq response (first 300 chars):', rawResponse.substring(0, 300));

    // Parse safely
    let parsed;
    try {
      parsed = JSON.parse(rawResponse);
    } catch (parseErr) {
      console.error('[MCQ] JSON parse failed:', parseErr.message);
      throw new Error('Groq returned invalid JSON');
    }

    const mcqs = parsed.mcqs || parsed.questions || [];

    if (!Array.isArray(mcqs) || mcqs.length !== 8) {
      throw new Error(`Expected exactly 8 MCQs, received ${mcqs.length}`);
    }

    // ────────────────────────────────────────────────
    // Deep validation + normalization
    // ────────────────────────────────────────────────
    const validatedMcqs = mcqs.map((q, index) => {
      if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
        throw new Error(`MCQ ${index + 1}: Missing or invalid question text`);
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`MCQ ${index + 1}: Must have exactly 4 options`);
      }

      if (!q.options.includes(q.answer)) {
        throw new Error(`MCQ ${index + 1}: Answer "${q.answer}" not found in options`);
      }

      return {
        question: q.question.trim(),
        options: q.options.map(opt => opt.trim()),
        answer: q.answer.trim(),
        explanation: (q.explanation || 'No explanation provided.').trim()
      };
    });

    // ────────────────────────────────────────────────
    // Cache with metadata
    // ────────────────────────────────────────────────
    if (videoId) {
      quizCache.set(videoId, {
        mcqs: validatedMcqs,
        timestamp: Date.now(),
        sourceLength: knowledgeSource.length,
        generatedAt: new Date().toISOString()
      });
      console.log(`[MCQ] Successfully cached ${validatedMcqs.length} MCQs for ${videoId}`);
    }

    return NextResponse.json({ success: true, mcqs: validatedMcqs });

  } catch (error) {
    console.error('[MCQ POST ERROR]', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      name: error.name,
      cause: error.cause
    });

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to generate assessment',
        errorType: error.name || 'Unknown'
      },
      { status: 500 }
    );
  }
}