import { Groq } from 'groq-sdk';
import { NextResponse } from 'next/server';

// Initialize Groq client with your API Key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY_3 || process.env.GROQ_API_KEY || 'dummy-key-for-build',
});

/**
 * POST handler for audio transcription
 * Expects a FormData object containing an 'audio' or 'file' blob
 */
export async function POST(req) {
  try {
    // 1. Parse the incoming Form Data
    const formData = await req.formData();
    const audioFile = formData.get('file');

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: "No audio file found in request." },
        { status: 400 }
      );
    }

    // 2. Call Groq Whisper Large v3
    // The Groq SDK handles the conversion from Web File/Blob to the appropriate stream
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      // IMPORTANT: We prompt the AI to keep disfluencies for our clutter audit
      prompt: "Transcribe the audio exactly as spoken. Include all filler words like um, ah, uh, like, so, and basically. Do not clean up the speech.",
      response_format: "verbose_json",
      temperature: 0, // Keep it deterministic
      language: "en", // Optional: Force English for better precision
    });

    // 3. Return the transcription text to the frontend
    return NextResponse.json({
      success: true,
      text: transcription.text,
    });

  } catch (error) {
    console.error("Transcription Error:", error);

    // Handle specific Groq API errors
    const errorMessage = error.response?.data?.error?.message || "Internal server error during transcription.";

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Optional: Next.js Config
 * If you are deploying to Vercel and expect long recordings, 
 * you may need to increase the maximum execution time.
 */
export const maxDuration = 300; // 60 seconds (requires Pro plan on Vercel)