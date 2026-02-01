import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { multiAccountStorage } from '@/lib/token-storage';
import { analyticsStorage } from '@/lib/analytics-storage';

export async function GET() {
    try {
        const accounts = multiAccountStorage.getAllAccounts();
        if (!accounts || accounts.length === 0) {
            return NextResponse.json({ error: 'No YouTube accounts connected' }, { status: 401 });
        }

        const allVideos = analyticsStorage.getAll();

        if (allVideos.length === 0) {
            return NextResponse.json({ videos: [], accounts: accounts.map(a => ({ id: a.id, channelName: a.channelName, channelId: a.channelId })) });
        }

        // Process each account
        let totalUpdated = 0;
        for (const account of accounts) {
            if (!account.tokens.access_token) continue;

            // Filter videos for THIS account only
            const accountVideos = allVideos.filter(v => v.channelId === account.channelId);
            const accountVideoIds = accountVideos.map(v => v.youtubeId).filter(Boolean);

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
                    multiAccountStorage.updateTokens(account.id, {
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
                                    analyticsStorage.updateData(item.id, updates);
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
        const updatedVideos = analyticsStorage.getAll();

        return NextResponse.json({
            success: true,
            updated: totalUpdated,
            videos: updatedVideos,
            accounts: accounts.map(a => ({ id: a.id, channelName: a.channelName, channelId: a.channelId }))
        });

    } catch (error: any) {
        console.error('Analytics update failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to update analytics' }, { status: 500 });
    }
}
