
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
    private async getClient(userId: string = 'dev-id-001') {
        const account = await multiAccountStorage.getActiveAccount(userId);
        if (account && account.tokens) {
            const oauth2Client = new google.auth.OAuth2(
                process.env.YOUTUBE_CLIENT_ID,
                process.env.YOUTUBE_CLIENT_SECRET,
                process.env.YOUTUBE_REDIRECT_URI
            );
            oauth2Client.setCredentials(account.tokens);
            return google.youtube({ version: 'v3', auth: oauth2Client });
        }
        return google.youtube({ version: 'v3', auth: process.env.GOOGLE_API_KEY });
    }

    /**
     * Search for a channel by handle (e.g. "@MrBeast") or name
     */
    async findChannelId(handle: string, userId?: string): Promise<{ id: string, title: string, thumbnail: string } | null> {
        try {
            const youtube = await this.getClient(userId);
            const res = await youtube.search.list({
                part: ['snippet'] as any,
                q: handle,
                type: ['channel'] as any,
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
    async getTopChannelVideos(channelId: string, maxResults: number = 10, userId?: string): Promise<CompetitorVideo[]> {
        try {
            const youtube = await this.getClient(userId);
            // 1. Get Channel Uploads Playlist ID
            const channelRes = await youtube.channels.list({
                part: ['contentDetails'] as any,
                id: [channelId]
            });

            const uploadsPlaylistId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

            if (!uploadsPlaylistId) return [];

            const searchRes = await youtube.search.list({
                part: ['snippet'] as any,
                channelId: channelId,
                order: 'viewCount' as any,
                maxResults: maxResults,
                type: ['video'] as any
            });

            const videoIds = searchRes.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];

            if (videoIds.length === 0) return [];

            const videosRes = await youtube.videos.list({
                part: ['snippet', 'statistics'] as any,
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
     * Identify "Trending" videos
     */
    async getTrendingOnChannel(channelId: string, userId?: string): Promise<CompetitorVideo[]> {
        try {
            const youtube = await this.getClient(userId);
            const res = await youtube.search.list({
                part: ['snippet'] as any,
                channelId: channelId,
                order: 'date' as any,
                maxResults: 20,
                type: ['video'] as any
            });

            const videoIds = res.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
            if (!videoIds.length) return [];

            const statsRes = await youtube.videos.list({
                part: ['snippet', 'statistics'] as any,
                id: videoIds
            });

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
