import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { multiAccountStorage } from '@/lib/token-storage';
import { analyticsStorage, VideoAnalyticsData } from '@/lib/analytics-storage';
import { getAuthUser } from '@/lib/auth-util';

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const userId = user.id;
        const accounts = multiAccountStorage.getAllAccounts(userId);
        if (!accounts || accounts.length === 0) {
            return NextResponse.json({ error: 'No YouTube accounts connected', videos: [], accounts: [] });
        }

        const allVideos = analyticsStorage.getAll(userId);

        if (allVideos.length === 0) {
            return NextResponse.json({ videos: [], accounts: accounts.map((a: any) => ({ id: a.id, channelName: a.channelName, channelId: a.channelId })) });
        }

        // Process each account
        let totalUpdated = 0;
        for (const account of accounts) {
            if (!account.tokens.access_token) continue;

            // Filter videos for THIS account only
            const accountVideos = allVideos.filter((v: VideoAnalyticsData) => v.channelId === account.channelId);
            const accountVideoIds = accountVideos.map((v: VideoAnalyticsData) => v.youtubeId).filter(Boolean);

            if (accountVideoIds.length === 0) {
                console.log(`No videos found for account: ${account.channelName}`);
                continue;
            }

            const oauth2Client = new google.auth.OAuth2(
                process.env.YOUTUBE_CLIENT_ID,
                process.env.YOUTUBE_CLIENT_SECRET,
                process.env.YOUTUBE_REDIRECT_URI
            );

            oauth2Client.setCredentials(account.tokens);

            // Refresh token if needed
            if (account.tokens.expiry_date && account.tokens.expiry_date < Date.now() && account.tokens.refresh_token) {
                try {
                    const { credentials } = await oauth2Client.refreshAccessToken();
                    multiAccountStorage.updateTokens(userId, account.id, {
                        access_token: credentials.access_token!,
                        refresh_token: credentials.refresh_token || account.tokens.refresh_token,
                        expiry_date: credentials.expiry_date || undefined
                    });
                    oauth2Client.setCredentials(credentials);
                } catch (err) {
                    console.error(`Failed to refresh token for ${account.channelName}`, err);
                    continue; // Skip this account but continue with others
                }
            }

            // YouTube API allows up to 50 IDs per request
            const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
            const chunkSize = 50;

            // Fetch channel stats (subscribers, total views, total video count)
            try {
                const channelRes = await youtube.channels.list({
                    part: ['statistics'],
                    id: [account.channelId]
                });
                if (channelRes.data.items && channelRes.data.items.length > 0) {
                    const stats = channelRes.data.items[0].statistics;
                    account.subscriberCount = stats?.subscriberCount || '0';
                    account.videoCount = stats?.videoCount || '0';
                    account.viewCount = stats?.viewCount || '0';
                }
            } catch (err) {
                console.error(`Failed to fetch channel stats for ${account.channelName}`, err);
            }


            for (let i = 0; i < accountVideoIds.length; i += chunkSize) {
                const chunk = accountVideoIds.slice(i, i + chunkSize);
                try {
                    const response = await youtube.videos.list({
                        part: ['statistics', 'snippet'],
                        id: chunk
                    });

                    if (response.data.items) {
                        for (const item of response.data.items) {
                            if (item.id) {
                                const updates: any = {};

                                // Update stats
                                if (item.statistics) {
                                    updates.stats = {
                                        viewCount: item.statistics.viewCount || '0',
                                        likeCount: item.statistics.likeCount || '0',
                                        commentCount: item.statistics.commentCount || '0',
                                        lastUpdated: new Date().toISOString()
                                    };
                                }

                                // Update thumbnail
                                if (item.snippet?.thumbnails?.high?.url) {
                                    updates.thumbnailUrl = item.snippet.thumbnails.high.url;
                                } else if (item.snippet?.thumbnails?.medium?.url) {
                                    updates.thumbnailUrl = item.snippet.thumbnails.medium.url;
                                } else if (item.snippet?.thumbnails?.default?.url) {
                                    updates.thumbnailUrl = item.snippet.thumbnails.default.url;
                                }

                                // Ensure channel info is set (in case old videos don't have it)
                                updates.channelId = account.channelId;
                                updates.channelName = account.channelName;

                                if (Object.keys(updates).length > 0) {
                                    analyticsStorage.updateData(userId, item.id, updates);
                                    totalUpdated++;
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching stats for ${account.channelName}:`, err);
                    // Continue with next chunk
                }
            }
        }

        // Return fresh data with account info
        const updatedVideos = analyticsStorage.getAll(userId);

        return NextResponse.json({
            success: true,
            updated: totalUpdated,
            videos: updatedVideos,
            accounts: accounts.map((a: any) => ({
                id: a.id,
                channelName: a.channelName,
                channelId: a.channelId,
                subscriberCount: a.subscriberCount,
                videoCount: a.videoCount,
                viewCount: a.viewCount
            }))
        });

    } catch (error: any) {
        console.error('Analytics update failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to update analytics' }, { status: 500 });
    }
}
