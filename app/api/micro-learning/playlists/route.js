// app/api/playlists/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const idsString = searchParams.get('ids');

  if (!idsString) {
    return NextResponse.json(
      { error: 'No playlist IDs provided' },
      { status: 400 }
    );
  }

  const ids = idsString.split(',').map(id => id.trim()).filter(id => id !== '');
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('YouTube API key missing');
    return NextResponse.json(
      { error: 'Server configuration error: API key missing' },
      { status: 500 }
    );
  }

  const results = [];

  // Batch in groups of 50 (YouTube limit for 'playlists' endpoint)
  for (let i = 0; i < ids.length; i += 50) {
    const batchIds = ids.slice(i, i + 50).join(',');
    const url = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${batchIds}&maxResults=50&key=${apiKey}`;

    try {
      const res = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!res.ok) {
        console.error(`YouTube API error for batch ${i}: ${res.status} ${res.statusText}`);
        continue; // Skip failed batch, continue with others
      }

      const data = await res.json();

      if (data.items && Array.isArray(data.items)) {
        results.push(...data.items);
      }
    } catch (error) {
      console.error(`Fetch error for batch ${i}:`, error);
      // Continue to next batch instead of failing whole request
    }
  }

  // Return clean array of playlist objects
  return NextResponse.json(results);
}