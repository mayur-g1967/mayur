// lib/video-recommender.js
import { CATEGORY_MAP } from './data';

/**
 * Recommends one video for each feedback area based on the suggested category.
 * @param {Array} feedbackItems - Array of feedback objects with 'category' field.
 * @returns {Promise<Array>} - Array of recommended video objects.
 */
export async function recommendVideos(feedbackItems) {
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error('YouTube API key is missing for video recommendation');
        return [];
    }

    const recommendations = [];

    for (const item of feedbackItems) {
        const category = item.category?.toLowerCase();
        const playlistIdsString = CATEGORY_MAP[category];

        if (!playlistIdsString) continue;

        const playlistIds = playlistIdsString.split(',');
        // Shuffle playlistIds to pick a random playlist for variety
        const shuffledPlaylists = [...playlistIds].sort(() => 0.5 - Math.random());
        const playlistId = shuffledPlaylists[0];

        try {
            // Fetch more results to allow for better matching
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=15&playlistId=${playlistId}&key=${apiKey}`
            );

            if (!res.ok) continue;

            const data = await res.json();
            if (data.items && data.items.length > 0) {
                // Find the best matching video based on the AI's searchQuery
                const query = item.searchQuery?.toLowerCase() || "";
                const keywords = query.split(' ').filter(k => k.length > 2);

                let bestMatch = data.items[0];
                let maxScore = -1;

                data.items.forEach(vid => {
                    const title = vid.snippet.title.toLowerCase();
                    const desc = vid.snippet.description.toLowerCase();
                    let score = 0;

                    keywords.forEach(kw => {
                        if (title.includes(kw)) score += 3;
                        if (desc.includes(kw)) score += 1;
                    });

                    if (score > maxScore) {
                        maxScore = score;
                        bestMatch = vid;
                    }
                });

                // If no good match was found, pick a random one from the first 5 for variety
                if (maxScore <= 0) {
                    const randomIndex = Math.floor(Math.random() * Math.min(data.items.length, 5));
                    bestMatch = data.items[randomIndex];
                }

                const video = bestMatch.snippet;

                recommendations.push({
                    id: video.resourceId.videoId,
                    playlistId: playlistId,
                    title: video.title,
                    thumbnail: video.thumbnails?.maxres?.url || video.thumbnails?.high?.url || video.thumbnails?.medium?.url,
                    category: category,
                    feedbackTitle: item.title
                });
            }
        } catch (error) {
            console.error(`Error fetching recommendation for category ${category}:`, error);
        }

        // Limit to 3 recommendations total (since there are 3 feedback items)
        if (recommendations.length >= 3) break;
    }

    return recommendations;
}
