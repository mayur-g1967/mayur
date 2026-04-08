import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const playlistId = searchParams.get('playlistId');

  if (!playlistId) {
    return NextResponse.json({ error: 'No playlistId provided' }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'YouTube API key missing' }, { status: 500 });
  }

  try {
    // 1. Fetch playlist items (videos in the playlist)
    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!itemsRes.ok) throw new Error(`YouTube API items error: ${itemsRes.status}`);
    const itemsData = await itemsRes.json();
    const items = itemsData.items || [];

    if (items.length === 0) {
      return NextResponse.json({ videos: [], channelLogos: {} });
    }

    const videoIds = [...new Set(items.map(item => item.contentDetails.videoId))].join(',');

    // 2. Fetch extra video details (duration, views)
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    if (!videosRes.ok) throw new Error(`YouTube API videos error: ${videosRes.status}`);
    const videosData = await videosRes.json();
    const videos = videosData.items || [];

    // 3. Fetch channel logos
    const channelIds = [...new Set(videos.map(v => v.snippet.channelId))].join(',');
    const channelsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds}&key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    const channelLogos = {};
    if (channelsRes.ok) {
      const channelsData = await channelsRes.json();
      channelsData.items?.forEach(ch => {
        channelLogos[ch.id] = ch.snippet.thumbnails?.default?.url || "";
      });
    }

    return NextResponse.json({ videos, channelLogos });
  } catch (error) {
    console.error('Playlist Details API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
