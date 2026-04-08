const { Innertube, UniversalCache } = require('youtubei.js');

async function testTranscript(videoId) {
  try {
    const youtube = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      fetch: (input, init) => fetch(input, { ...init, headers: { ...init?.headers, 'x-youtube-client-name': '1', 'x-youtube-client-version': '2.20240323.01.00' } }) // Some headers bypass checks
    });
    // Wait, the 400 error was from getInfo
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();
    if (transcriptData && transcriptData.transcript?.content?.body?.initial_segments) {
       console.log("SUCCESS!");
       process.exit(0);
    }
  } catch(e) {
    console.error("error:", e.message);
  }
}
testTranscript('dQw4w9WgXcQ');
