const { Innertube, UniversalCache } = require('youtubei.js');

async function testGladiaWithDirectUrl(videoId) {
  try {
    const youtube = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true
    });
    
    console.log(`[Test] Fetching info for ${videoId}...`);
    const info = await youtube.getInfo(videoId);
    
    // Get best audio URL
    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    const directUrl = format.decipher(youtube.session.player);
    console.log('Direct URL obtained.');
    
    // Call Gladia
    require('dotenv').config();
    const gladiaKey = process.env.GLADIA_API_KEY;
    const res = await fetch('https://api.gladia.io/v2/transcription', {
      method: 'POST',
      headers: {
        'x-gladia-key': gladiaKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: directUrl,
        diarization: true
      })
    });
    
    console.log("Gladia Status:", res.status);
    const json = await res.json();
    console.log("Gladia Response:", json.status || json.message);

  } catch(e) {
    console.error("❌ Failed:", e.message);
  }
}

testGladiaWithDirectUrl('dQw4w9WgXcQ');
