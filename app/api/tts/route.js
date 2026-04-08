import * as googleTTS from 'google-tts-api';

export async function POST(req) {
    try {
        const { text, lang = 'en', slow = false } = await req.json();

        if (!text) {
            return Response.json({ error: 'Text is required' }, { status: 400 });
        }

        // google-tts-api has a 200 character limit per request, 
        // but getAllAudioBase64 handles splitting the text into smaller chunks automatically
        const audioChunks = await googleTTS.getAllAudioBase64(text, {
            lang,
            slow,
            host: 'https://translate.google.com',
            splitPunct: ',.?',
            timeout: 10000,
        });

        // Return the array of chunks { shortText, base64 }
        return Response.json({ chunks: audioChunks });

    } catch (error) {
        console.error('TTS API Error:', error);
        return Response.json(
            { error: 'Failed to generate speech', details: error.message },
            { status: 500 }
        );
    }
}
