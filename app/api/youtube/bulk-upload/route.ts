import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
    try {
        // Get YouTube credentials from cookies
        const accessToken = request.cookies.get('youtube_access_token')?.value;
        const refreshToken = request.cookies.get('youtube_refresh_token')?.value;

        console.log('YouTube tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken
        });

        if (!accessToken) {
            console.error('No YouTube access token found in cookies');
            return NextResponse.json(
                {
                    error: 'YouTube account not connected. Please connect your YouTube account first.',
                    needsAuth: true
                },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { memes, schedule } = body;

        if (!Array.isArray(memes) || memes.length === 0) {
            return NextResponse.json(
                { error: 'Memes array is required' },
                { status: 400 }
            );
        }

        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        const results = [];
        const uploadedVideos = [];

        // Process each meme
        for (let i = 0; i < Math.min(memes.length, 6); i++) { // Limit to 6 per batch for quota
            const meme = memes[i];
            const scheduledFor = schedule ? new Date(schedule[i]) : new Date();

            try {
                // Generate video from meme config
                const videoBlob = await generateVideoFromMeme(meme);

                if (!videoBlob) {
                    throw new Error('Failed to generate video');
                }

                // Convert blob to buffer
                const arrayBuffer = await videoBlob.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Create readable stream
                const videoStream = Readable.from(buffer);

                // Upload to YouTube
                const uploadResponse = await youtube.videos.insert({
                    part: ['snippet', 'status'],
                    requestBody: {
                        snippet: {
                            title: meme.title,
                            description: meme.description,
                            tags: meme.tags,
                            categoryId: '23', // Comedy category
                        },
                        status: {
                            privacyStatus: 'public',
                            selfDeclaredMadeForKids: false,
                        },
                    },
                    media: {
                        body: videoStream,
                    },
                });

                const videoId = uploadResponse.data.id;
                const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

                uploadedVideos.push({
                    index: i,
                    success: true,
                    videoId,
                    videoUrl,
                    title: meme.title,
                    scheduledFor: scheduledFor.toISOString(),
                });

                results.push({
                    index: i,
                    success: true,
                    videoId,
                    videoUrl,
                });

            } catch (error: any) {
                console.error(`Failed to upload meme ${i}:`, error);
                results.push({
                    index: i,
                    success: false,
                    error: error.message,
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            total: Math.min(memes.length, 6),
            uploaded: successCount,
            failed: results.length - successCount,
            results,
            uploadedVideos,
            message: `Successfully uploaded ${successCount} videos to YouTube!`,
        });

    } catch (error: any) {
        console.error('Bulk upload error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload videos' },
            { status: 500 }
        );
    }
}

/**
 * Generate video from meme configuration
 * This is a simplified version - in production you'd use server-side rendering
 */
async function generateVideoFromMeme(meme: any): Promise<Blob | null> {
    // For now, we'll create a simple placeholder video
    // In production, you would:
    // 1. Load the video template
    // 2. Render text overlays
    // 3. Mix audio
    // 4. Export as MP4

    // Since we can't do server-side video rendering without FFmpeg,
    // we'll return null and handle this client-side for now
    return null;
}
