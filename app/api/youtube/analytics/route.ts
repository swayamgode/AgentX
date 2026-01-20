import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { multiAccountStorage } from '@/lib/token-storage';
import { analyticsStorage } from '@/lib/analytics-storage';

export async function GET() {
    try {
        const account = multiAccountStorage.getActiveAccount();
        if (!account || !account.tokens.access_token) {
            return NextResponse.json({ error: 'No YouTube account connected' }, { status: 401 });
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
                console.error("Failed to refresh token", err);
                return NextResponse.json({ error: 'Authentication expired' }, { status: 401 });
            }
        }

        const videos = analyticsStorage.getAll();
        const videoIds = videos.map(v => v.youtubeId).filter(Boolean);

        if (videoIds.length === 0) {
            return NextResponse.json({ message: 'No videos to check', stats: [] });
        }

        // YouTube API allows up to 50 IDs per request
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const chunkSize = 50;
        let updatedCount = 0;

        for (let i = 0; i < videoIds.length; i += chunkSize) {
            const chunk = videoIds.slice(i, i + chunkSize);
            const response = await youtube.videos.list({
                part: ['statistics'],
                id: chunk
            });

            if (response.data.items) {
                for (const item of response.data.items) {
                    if (item.id && item.statistics) {
                        analyticsStorage.updateStats(item.id, {
                            viewCount: item.statistics.viewCount || '0',
                            likeCount: item.statistics.likeCount || '0',
                            commentCount: item.statistics.commentCount || '0',
                            lastUpdated: new Date().toISOString()
                        });
                        updatedCount++;
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            message: `Updated analytics for ${updatedCount} videos`
        });

    } catch (error: any) {
        console.error('Analytics update failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to update analytics' }, { status: 500 });
    }
}
