import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-util';

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        const { keyManager } = await import('@/lib/key-manager');
        const origin = request.nextUrl.origin;
        const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${origin}/api/youtube/callback`;

        const app = keyManager.getAllYouTubeApps()[0]; // Consistently use first app for now
        const clientId = app?.id || process.env.YOUTUBE_CLIENT_ID;

        if (!clientId || !process.env.YOUTUBE_CLIENT_SECRET) {
            console.error('[YouTube Auth] Missing Client ID or Client Secret');
            return NextResponse.redirect(new URL(`/settings?error=auth_failed&msg=${encodeURIComponent(`Missing API credentials. ID: ${clientId?.substring(0, 10)}... Link: ${redirectUri}`)}`, request.url));
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
