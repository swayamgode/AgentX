import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
    try {
        // Get access token from cookie
        const accessToken = request.cookies.get('youtube_access_token')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Not authenticated. Please connect your YouTube account first.' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const videoFile = formData.get('video') as File;
        const title = formData.get('title') as string || 'Meme Reel';
        const description = formData.get('description') as string || 'Created with AgentX Meme Studio';
        const tags = formData.get('tags') as string || 'meme,funny,shorts';
        const privacy = formData.get('privacy') as string || 'public';

        if (!videoFile) {
            return NextResponse.json(
                { error: 'No video file provided' },
                { status: 400 }
            );
        }

        // Initialize YouTube API client
        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: accessToken,
        });

        const youtube = google.youtube({
            version: 'v3',
            auth: oauth2Client,
        });

        // Convert File to Buffer
        const arrayBuffer = await videoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload video
        const response = await youtube.videos.insert({
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title,
                    description,
                    tags: tags.split(',').map(tag => tag.trim()),
                    categoryId: '23', // Comedy category
                },
                status: {
                    privacyStatus: privacy,
                    selfDeclaredMadeForKids: false,
                },
            },
            media: {
                body: buffer,
            },
        });

        const videoId = response.data.id;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        return NextResponse.json({
            success: true,
            videoId,
            videoUrl,
            message: 'Video uploaded successfully to YouTube!',
        });

    } catch (error: any) {
        console.error('YouTube upload error:', error);

        if (error.code === 401) {
            return NextResponse.json(
                { error: 'Authentication expired. Please reconnect your YouTube account.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to upload video to YouTube' },
            { status: 500 }
        );
    }
}
