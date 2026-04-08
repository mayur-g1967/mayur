// Quick test to validate Strategy 2 locally
async function testStrategy2(videoId) {
  const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  };

  console.log(`Fetching YouTube page for: ${videoId}`);
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: BROWSER_HEADERS,
  });

  console.log(`Page status: ${pageRes.status}`);
  const html = await pageRes.text();

  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\})\s*(?:;|<\/script>)/s);
  if (!playerResponseMatch) {
    console.error('❌ Could not find ytInitialPlayerResponse');
    return;
  }

  const playerResponse = JSON.parse(playerResponseMatch[1]);
  const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

  if (!captionTracks || captionTracks.length === 0) {
    console.error('❌ No caption tracks found');
    return;
  }

  console.log(`Found ${captionTracks.length} caption track(s):`);
  captionTracks.forEach(t => console.log(`  - lang: ${t.languageCode}, kind: ${t.kind || 'manual'}`));

  const track =
    captionTracks.find(t => t.languageCode === 'en' && t.kind === 'asr') ||
    captionTracks.find(t => t.languageCode === 'en') ||
    captionTracks[0];

  console.log(`\nUsing track: ${track.languageCode} (${track.kind || 'manual'})`);
  const captionUrl = `${track.baseUrl}&fmt=json3`;

  const captionRes = await fetch(captionUrl, { headers: { 'User-Agent': BROWSER_HEADERS['User-Agent'] } });
  console.log(`Caption fetch status: ${captionRes.status}`);
  const captionData = await captionRes.json();

  const transcript = (captionData.events || [])
    .filter(e => e.segs)
    .map(e => e.segs.map(s => s.utf8 || '').join(''))
    .join(' ')
    .replace(/\n/g, ' ')
    .trim();

  console.log(`\n✅ SUCCESS! Transcript length: ${transcript.length} characters`);
  console.log(`Preview: "${transcript.substring(0, 300)}..."`);
}

// Test with a YouTube video that 100% has auto-captions
testStrategy2('dQw4w9WgXcQ').catch(console.error);
