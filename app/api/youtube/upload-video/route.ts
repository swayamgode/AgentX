import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { tokenStorage } from '@/lib/token-storage';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const videoFile = formData.get('video') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const tags = JSON.parse(formData.get('tags') as string || '[]');

        if (!videoFile) {
            return NextResponse.json({ error: 'Video file is required' }, { status: 400 });
        }

        let tokens = tokenStorage.load();
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
                tokenStorage.save({
                    access_token: credentials.access_token!,
                    refresh_token: credentials.refresh_token || tokens.refresh_token,
                    expiry_date: credentials.expiry_date || undefined
                });
                tokens = { ...tokens, ...credentials };
            } catch (err) {
                console.error("Failed to refresh token", err);
                return NextResponse.json({ error: 'Authentication expired' }, { status: 401 });
            }
        }

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        const stream = Readable.from(buffer);

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
                    privacyStatus: 'public',
                    selfDeclaredMadeForKids: false,
                },
            },
            media: {
                body: stream,
            },
        });

        return NextResponse.json({
            success: true,
            videoId: response.data.id,
            videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}
