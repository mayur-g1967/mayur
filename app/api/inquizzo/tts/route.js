import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { text } = await req.json();
        if (!text) return NextResponse.json({ message: "Text is required" }, { status: 400 });

        // --- Provider 1: Microsoft Edge Neural (High Quality) ---
        try {
            const edgeVoice = "en-US-AriaNeural"; // Professional and natural
            const edgeUrl = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/single-step?api-key=6A5AA1D4EAFF4E9FB37E23D1A48D9886`;
            const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${edgeVoice}'><prosody rate='0%' pitch='0%'>${text}</prosody></voice></speak>`;

            const response = await fetch(edgeUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/ssml+xml",
                    "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/91.0.864.41",
                },
                body: ssml,
            });

            if (response.ok) {
                const buffer = await response.arrayBuffer();
                return new NextResponse(buffer, { headers: { "Content-Type": "audio/mpeg" } });
            }
        } catch (e) {
            console.warn("Edge TTS failed, falling back to Google:", e.message);
        }

        // --- Provider 2: Google Translate Neural (Reliable Fallback) ---
        try {
            const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
            const response = await fetch(googleUrl, {
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
            });

            if (response.ok) {
                const buffer = await response.arrayBuffer();
                return new NextResponse(buffer, { headers: { "Content-Type": "audio/mpeg" } });
            }
        } catch (e) {
            console.error("Google TTS failed too:", e.message);
        }

        throw new Error("All TTS providers failed");

    } catch (error) {
        console.error("❌ TTS Proxy error:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
