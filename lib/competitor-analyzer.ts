
import { google } from 'googleapis';
import { multiAccountStorage } from './token-storage';

export interface CompetitorVideo {
    videoId: string;
    title: string;
    publishedAt: string;
    viewCount: string;
    likeCount: string;
    channelTitle: string;
    thumbnailUrl: string;
}

export class CompetitorAnalyzer {
    private youtube;

    constructor() {
        // We use the active account's credentials to make these public API calls
        // This avoids needing a separate API Key if we already have OAuth
        const account = multiAccountStorage.getActiveAccount('dev-id-001');
        if (account && account.tokens) {
            const oauth2Client = new google.auth.OAuth2(
                process.env.YOUTUBE_CLIENT_ID,
                process.env.YOUTUBE_CLIENT_SECRET,
                process.env.YOUTUBE_REDIRECT_URI
            );
            oauth2Client.setCredentials(account.tokens);
            this.youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        } else {
            // Fallback to API Key if no user context (though in this app structure, we usually have user context)
            // Note: In a production app you'd want robust fallback. 
            // For now, we assume if you can't log in, you can't use the app.
            this.youtube = google.youtube({ version: 'v3', auth: process.env.GOOGLE_API_KEY });
        }
    }

    /**
     * Search for a channel by handle (e.g. "@MrBeast") or name
     */
    async findChannelId(handle: string): Promise<{ id: string, title: string, thumbnail: string } | null> {
        try {
            const res = await this.youtube.search.list({
                part: ['snippet'],
                q: handle,
                type: ['channel'],
                maxResults: 1
            });

            if (res.data.items && res.data.items.length > 0) {
                const item = res.data.items[0];
                return {
                    id: item.snippet?.channelId || '',
                    title: item.snippet?.title || '',
                    thumbnail: item.snippet?.thumbnails?.default?.url || ''
                };
            }
            return null;
        } catch (error) {
            console.error("Error finding channel:", error);
            return null;
        }
    }

    /**
     * Get top performing videos from a specific channel
     */
    async getTopChannelVideos(channelId: string, maxResults: number = 10): Promise<CompetitorVideo[]> {
        try {
            // 1. Get Channel Uploads Playlist ID
            const channelRes = await this.youtube.channels.list({
                part: ['contentDetails'],
                id: [channelId]
            });

            const uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

            if (!uploadsPlaylistId) return [];

            // 2. Get recent videos from that playlist
            // Note: 'search' endpoint with order='viewCount' is better for "Top" videos, 
            // but 'activities' or 'playlistItems' is better for "Recent".
            // The prompt asks for "Trending", which usually means "Recent & High Views" or just "Top".
            // Let's use SEARCH to find the actual most popular videos of the channel.

            const searchRes = await this.youtube.search.list({
                part: ['snippet'],
                channelId: channelId,
                order: 'viewCount', // Get their most popular content
                maxResults: maxResults,
                type: ['video']
            });

            const videoIds = searchRes.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];

            if (videoIds.length === 0) return [];

            // 3. Get detailed stats for these videos
            const videosRes = await this.youtube.videos.list({
                part: ['snippet', 'statistics'],
                id: videoIds
            });

            return videosRes.data.items?.map(item => ({
                videoId: item.id || '',
                title: item.snippet?.title || '',
                publishedAt: item.snippet?.publishedAt || '',
                viewCount: item.statistics?.viewCount || '0',
                likeCount: item.statistics?.likeCount || '0',
                channelTitle: item.snippet?.channelTitle || '',
                thumbnailUrl: item.snippet?.thumbnails?.medium?.url || ''
            })) || [];

        } catch (error) {
            console.error("Error fetching competitor videos:", error);
            return [];
        }
    }

    /**
     * Identify "Trending" videos (High views recently loaded)
     * For simplicity, as the search API doesn't strictly support "trending" filter for a channel,
     * we will fetch recent uploads and sort by view count manually.
     */
    async getTrendingOnChannel(channelId: string): Promise<CompetitorVideo[]> {
        try {
            const res = await this.youtube.search.list({
                part: ['snippet'],
                channelId: channelId,
                order: 'date', // Get newest first
                maxResults: 20,
                type: ['video']
            });

            const videoIds = res.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
            if (!videoIds.length) return [];

            const statsRes = await this.youtube.videos.list({
                part: ['snippet', 'statistics'],
                id: videoIds
            });

            // Sort by View Count descending to find "Trending" among recent
            const videos = statsRes.data.items?.map(item => ({
                videoId: item.id || '',
                title: item.snippet?.title || '',
                publishedAt: item.snippet?.publishedAt || '',
                viewCount: item.statistics?.viewCount || '0',
                likeCount: item.statistics?.likeCount || '0',
                channelTitle: item.snippet?.channelTitle || '',
                thumbnailUrl: item.snippet?.thumbnails?.medium?.url || ''
            })) || [];

            return videos.sort((a, b) => parseInt(b.viewCount) - parseInt(a.viewCount));

        } catch (e) {
            console.error(e);
            return [];
        }
    }
}

export const competitorAnalyzer = new CompetitorAnalyzer();
