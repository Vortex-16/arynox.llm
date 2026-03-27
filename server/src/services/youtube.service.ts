import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export interface YouTubeVideoResult {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    viewCount: number;
    likeCount: number;
    url: string;
}

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Extracts a clean topic keyword string from a verbose student query.
 * e.g. "give me a video on dijkstra's algorithm" → "dijkstra's algorithm"
 */
function extractTopicFromQuery(query: string): string {
    return query
        .replace(/\b(give me|show me|find me|i want|can you|please|provide|recommend|suggest|a good|the best|best|good)\b/gi, '')
        .replace(/\b(video|videos|tutorial|tutorials|lecture|lectures|youtube|link|on|for|about|related to|regarding)\b/gi, '')
        .trim()
        .replace(/\s+/g, ' ');
}

/**
 * Searches YouTube for the best video on a given topic.
 * Ranks candidates by composite score: viewCount * 0.6 + likeCount * 0.4 (normalized).
 * Returns the top result or null on failure.
 */
export const searchBestYouTubeVideo = async (query: string): Promise<YouTubeVideoResult | null> => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.warn('[YouTube] YOUTUBE_API_KEY not set. Skipping video search.');
        return null;
    }

    const topic = extractTopicFromQuery(query);
    console.log(`[YouTube] Searching for: "${topic}"`);

    try {
        // Step 1: Search for video candidates
        const searchRes = await axios.get(`${YT_API_BASE}/search`, {
            params: {
                key: apiKey,
                q: topic,
                part: 'snippet',
                type: 'video',
                maxResults: 10,
                relevanceLanguage: 'en',
                videoCategoryId: '27', // Category 27 = Education
                order: 'relevance',
            }
        });

        const items = searchRes.data.items as any[];
        if (!items || items.length === 0) {
            console.warn('[YouTube] No video search results found.');
            return null;
        }

        const videoIds = items.map((item: any) => item.id.videoId).join(',');

        // Step 2: Fetch statistics for all candidates in one call
        const statsRes = await axios.get(`${YT_API_BASE}/videos`, {
            params: {
                key: apiKey,
                id: videoIds,
                part: 'statistics,snippet',
            }
        });

        const videos = statsRes.data.items as any[];
        if (!videos || videos.length === 0) {
            console.warn('[YouTube] Could not fetch video statistics.');
            return null;
        }

        // Step 3: Rank by composite score (views 60%, likes 40%)
        const ranked = videos
            .map((v: any) => ({
                videoId: v.id,
                title: v.snippet?.title || 'Untitled',
                channelTitle: v.snippet?.channelTitle || 'Unknown Channel',
                thumbnailUrl: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url || '',
                viewCount: parseInt(v.statistics?.viewCount || '0', 10),
                likeCount: parseInt(v.statistics?.likeCount || '0', 10),
            }))
            .sort((a, b) => {
                const scoreA = a.viewCount * 0.6 + a.likeCount * 0.4;
                const scoreB = b.viewCount * 0.6 + b.likeCount * 0.4;
                return scoreB - scoreA;
            });

        const best = ranked[0];
        console.log(`[YouTube] ✅ Best video: "${best.title}" — Views: ${best.viewCount.toLocaleString()}, Likes: ${best.likeCount.toLocaleString()}`);

        return {
            ...best,
            url: `https://www.youtube.com/watch?v=${best.videoId}`,
        };

    } catch (error: any) {
        const msg = error?.response?.data?.error?.message || error?.message;
        console.error('[YouTube] API error:', msg);
        return null;
    }
};
