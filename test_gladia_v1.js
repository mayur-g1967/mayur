require('dotenv').config();

async function testV1() {
  const gladiaKey = process.env.GLADIA_API_KEY;
  if (!gladiaKey) return console.log("NO KEY");
  
  const form = new FormData();
  form.append('audio_url', 'https://www.youtube.com/watch?v=R9Ihppczxok');
  // V1 supports audio_url via form-data or JSON?
  // Let's try JSON first if possible. Wait, V1 audio-transcription was multipart form data
  
  const res = await fetch('https://api.gladia.io/audio/text/audio-transcription/', {
    method: 'POST',
    headers: {
      'x-gladia-key': gladiaKey,
      'accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audio_url: 'https://www.youtube.com/watch?v=R9Ihppczxok'
    })
  });
  
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text.substring(0, 500));
}
testV1();
