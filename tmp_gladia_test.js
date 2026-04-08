require('dotenv').config();
const fs = require('fs');

async function test() {
  const gladiaKey = process.env.GLADIA_API_KEY;
  if (!gladiaKey) {
    console.error("No GLADIA_API_KEY found");
    return;
  }
  
  const initiateResponse = await fetch('https://api.gladia.io/v2/transcription', {
    method: 'POST',
    headers: {
      'x-gladia-key': gladiaKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: "https://www.youtube.com/watch?v=R9Ihppczxok", // Some youtube video
      diarization: true,
    }),
  });
  
  const text = await initiateResponse.text();
  fs.writeFileSync('gladia_test_output.json', JSON.stringify({
    status: initiateResponse.status,
    response: text
  }, null, 2));
  console.log('Saved to gladia_test_output.json');
}

test().catch(console.error);
