const { YoutubeTranscript } = require('youtube-transcript-plus');

async function check(videoId) {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log("Success! Extracted", transcript.length, "lines.");
  } catch(e) {
    console.error("Failed:", e.message);
  }
}

// Testing with a famous video that 100% has captions (Rick Astley)
check('dQw4w9WgXcQ');
