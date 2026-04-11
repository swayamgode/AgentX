import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-util';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const { keyManager } = await import('@/lib/key-manager');
        const app = keyManager.getNextYouTubeApp();
        const clientId = app?.id || process.env.YOUTUBE_CLIENT_ID;

        const redirectUri = process.env.YOUTUBE_REDIRECT_URI?.includes('localhost') 
            ? `${request.nextUrl.origin}/api/youtube/callback` 
            : (process.env.YOUTUBE_REDIRECT_URI || `${request.nextUrl.origin}/api/youtube/callback`);

        if (!clientId) {
            return NextResponse.json(
                { error: 'YouTube API not configured. Please add YOUTUBE_CLIENT_ID to environment variables.' },
                { status: 500 }
            );
        }

        // --- Auth Scopes ---
        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/youtube.readonly'
        ];

        // Build OAuth URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scopes.join(' '));
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');
        
        // Pass the clientId in the state so the callback knows which app was used
        authUrl.searchParams.set('state', clientId);

        return NextResponse.redirect(authUrl.toString());
    } catch (error) {
        console.error('YouTube auth error:', error);
        return NextResponse.json(
            { error: 'Failed to initiate YouTube authentication' },
            { status: 500 }
        );
    }
}
