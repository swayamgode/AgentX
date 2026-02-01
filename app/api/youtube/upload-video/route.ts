import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { tokenStorage, multiAccountStorage } from '@/lib/token-storage';
import { analyticsStorage } from '@/lib/analytics-storage';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const videoFile = formData.get('video') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = JSON.parse(formData.get('tags') as string || '[]');
        const accountId = formData.get('accountId') as string | null;

        // Extract metadata for analytics
        const topic = formData.get('topic') as string;
        const templateId = formData.get('templateId') as string;
        const texts = JSON.parse(formData.get('texts') as string || '[]');

        if (!videoFile) {
            return NextResponse.json({ error: 'Video file is required' }, { status: 400 });
        }

        // Load account-specific tokens
        let account;
        if (accountId) {
            account = multiAccountStorage.getAccount(accountId);
            if (!account) {
                return NextResponse.json({ error: 'Account not found' }, { status: 404 });
            }
        } else {
            // Use active account if no accountId specified
            account = multiAccountStorage.getActiveAccount();
            if (!account) {
                return NextResponse.json({ error: 'No YouTube account connected' }, { status: 401 });
            }
        }

        let tokens = account.tokens;
        if (!tokens || !tokens.access_token) {
            return NextResponse.json({ error: 'Not connected to YouTube' }, { status: 401 });
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        oauth2Client.setCredentials(tokens);

        // Check expiry and refresh if needed
        if (tokens.expiry_date && tokens.expiry_date < Date.now() && tokens.refresh_token) {
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                multiAccountStorage.updateTokens(account.id, {
                    access_token: credentials.access_token!,
                    refresh_token: credentials.refresh_token || tokens.refresh_token,
                    expiry_date: credentials.expiry_date || undefined
                });
                tokens = {
                    ...tokens,
                    ...credentials,
                    access_token: credentials.access_token!,
                    refresh_token: credentials.refresh_token || tokens.refresh_token || undefined,
                    expiry_date: credentials.expiry_date || undefined
                };
            } catch (err) {
                console.error("Failed to refresh token", err);
                return NextResponse.json({ error: 'Authentication expired' }, { status: 401 });
            }
        }

        // Debug logging
        console.log('Token status:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiryDate: tokens.expiry_date,
            isExpired: tokens.expiry_date ? tokens.expiry_date < Date.now() : 'unknown',
            now: Date.now()
        });

        const uploadVideo = async (authClient: any) => {
            const youtube = google.youtube({ version: 'v3', auth: authClient });
            const response = await youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: title.substring(0, 100),
                        description: description.substring(0, 5000),
                        tags: tags,
                        categoryId: '23', // Comedy
                    },
                    status: {
                        privacyStatus: formData.get('publishAt') ? 'private' : 'public',
                        publishAt: formData.get('publishAt') as string || undefined,
                        selfDeclaredMadeForKids: false,
                    },
                },
                media: {
                    body: Readable.from(Buffer.from(await videoFile.arrayBuffer())),
                },
            });
            return response;
        };

        try {
            const response = await uploadVideo(oauth2Client);
            const jsonResponse = {
                success: true,
                videoId: response.data.id,
                videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`
            };

            // Track upload for analytics
            if (response.data.id) {
                try {
                    analyticsStorage.addVideo({
                        youtubeId: response.data.id,
                        title,
                        topic: topic || 'unknown',
                        templateId: templateId || 'unknown',
                        texts,
                        channelId: account.channelId,
                        channelName: account.channelName
                    });
                } catch (err) {
                    console.error('Failed to save analytics data:', err);
                }
            }

            return NextResponse.json(jsonResponse);
        } catch (error: any) {
            console.error('Initial upload failed:', error.message);

            // If 401 and we have a refresh token, try to refresh and retry
            if (error.code === 401 && tokens.refresh_token) {
                console.log('Attempting to refresh token and retry...');
                try {
                    const { credentials } = await oauth2Client.refreshAccessToken();

                    // Update tokens in account storage
                    multiAccountStorage.updateTokens(account.id, {
                        access_token: credentials.access_token!,
                        refresh_token: credentials.refresh_token || tokens.refresh_token,
                        expiry_date: credentials.expiry_date || undefined
                    });

                    // Update client
                    oauth2Client.setCredentials(credentials);

                    // Retry upload
                    const response = await uploadVideo(oauth2Client);
                    const jsonResponse = {
                        success: true,
                        videoId: response.data.id,
                        videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`
                    };

                    // Track upload for analytics (retry case)
                    if (response.data.id) {
                        try {
                            analyticsStorage.addVideo({
                                youtubeId: response.data.id,
                                title,
                                topic: topic || 'unknown',
                                templateId: templateId || 'unknown',
                                texts,
                                channelId: account.channelId,
                                channelName: account.channelName
                            });
                        } catch (err) {
                            console.error('Failed to save analytics data:', err);
                        }
                    }

                    return NextResponse.json(jsonResponse);
                } catch (retryError: any) {
                    console.error('Retry failed:', retryError);
                    throw retryError; // Throw to outer catch
                }
            }
            throw error; // Throw if not 401 or no refresh token
        }

    } catch (error: any) {
        console.error('Upload error detail:', error);

        // Check for quota exceeded error
        if (error.code === 400 && error.message?.includes('exceeded the number of videos')) {
            return NextResponse.json({
                error: 'YouTube Daily Upload Limit Reached',
                message: 'You have reached your daily upload quota. This limit resets at midnight Pacific Time.',
                solutions: [
                    'Wait 24 hours for quota to reset',
                    'Verify your YouTube channel at youtube.com/verify to increase limit',
                    'Download videos and upload manually through YouTube Studio',
                    'Schedule uploads to spread them across multiple days'
                ],
                quotaInfo: {
                    unverified: '6 videos per day',
                    verified: '50-100 videos per day',
                    resetTime: 'Midnight Pacific Time'
                }
            }, { status: 429 }); // 429 = Too Many Requests
        }

        return NextResponse.json({
            error: error.message || 'Upload failed',
            details: error.response?.data || 'No details'
        }, { status: error.code || 500 });
    }
}
