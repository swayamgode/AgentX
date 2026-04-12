import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { tokenStorage, multiAccountStorage } from '@/lib/token-storage';
import { getAuthUser } from '@/lib/auth-util';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
    let account: any = null;
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

        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;

        if (!videoFile) {
            return NextResponse.json({ error: 'Video file is required' }, { status: 400 });
        }


        if (accountId) {
            account = await multiAccountStorage.getAccount(userId, accountId);
            if (!account) {
                return NextResponse.json({ error: 'Account not found' }, { status: 404 });
            }
        } else {
            // Use active account if no accountId specified
            account = await multiAccountStorage.getActiveAccount(userId);
            if (!account) {
                return NextResponse.json({ error: 'No YouTube account connected' }, { status: 401 });
            }
        }

        let tokens = account.tokens;
        if (!tokens || !tokens.access_token) {
            return NextResponse.json({ error: 'Not connected to YouTube' }, { status: 401 });
        }

        const oauth2Client = new google.auth.OAuth2(
            account.appCredentials?.clientId || process.env.YOUTUBE_CLIENT_ID,
            account.appCredentials?.clientSecret || process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        oauth2Client.setCredentials(tokens);

        // Check expiry and refresh if needed
        if (tokens.expiry_date && tokens.expiry_date < Date.now() && tokens.refresh_token) {
            try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                await multiAccountStorage.updateTokens(userId, account.id, {
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
                return NextResponse.json({
                    error: 'Authentication expired',
                    code: 'AUTH_EXPIRED',
                    accountId: account.id,
                    channelName: account.channelName
                }, { status: 401 });
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

            // No analytics tracking

            return NextResponse.json(jsonResponse);
        } catch (error: any) {
            console.error('Initial upload failed:', error.message);

            // If 401 and we have a refresh token, try to refresh and retry
            if (error.code === 401 && tokens.refresh_token) {
                console.log('Attempting to refresh token and retry...');
                try {
                    const { credentials } = await oauth2Client.refreshAccessToken();

                    // Update tokens in account storage
                    await multiAccountStorage.updateTokens(userId, account.id, {
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

                    // No analytics tracking

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
        if (error.code === 403 || (error.code === 400 && error.message?.includes('quota')) || error.message?.includes('exceeded the number of videos')) {
            const { keyManager } = await import('@/lib/key-manager');
            const clientId = account?.appCredentials?.clientId || process.env.YOUTUBE_CLIENT_ID;
            if (clientId) {
                keyManager.markYouTubeAppFailed(clientId);
            }

            return NextResponse.json({
                error: 'YouTube Daily Upload Limit Reached',
                message: 'This API project has reached its daily upload quota. Please select an account connected to a different Project, or wait until midnight PST for the reset.',
                solutions: [
                    'Use an account connected to a different Google Cloud Project',
                    'Wait 24 hours for quota to reset',
                    'Verify your YouTube channel to potentially increase limits',
                ],
                quotaInfo: {
                    limitReached: true,
                    projectId: clientId?.substring(0, 8) + '...'
                }
            }, { status: 429 });
        }

        return NextResponse.json({
            error: error.message || 'Upload failed',
            details: error.response?.data || 'No details'
        }, { status: error.code || 500 });
    }
}
