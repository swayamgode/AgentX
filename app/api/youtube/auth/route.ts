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

        // Pick the first non-failed YouTube app
        const app = keyManager.getAllYouTubeApps()[0];
        const clientId = app?.id || process.env.YOUTUBE_CLIENT_ID;
        // Use the app's own secret — fall back to env var if no dedicated app
        const clientSecret = app?.secret || process.env.YOUTUBE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('[YouTube Auth] Missing Client ID or Client Secret. Apps loaded:', keyManager.getAllYouTubeApps().length);
            return NextResponse.redirect(
                new URL(`/settings?error=auth_failed&msg=${encodeURIComponent(`Missing API credentials. Please add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET to your environment variables. Redirect URI: ${redirectUri}`)}`, request.url)
            );
        }

        // --- Auth Scopes ---
        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',  // needed to fetch email in callback
            'https://www.googleapis.com/auth/youtube.readonly'
        ];

        // Build OAuth URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', scopes.join(' '));
        authUrl.searchParams.set('access_type', 'offline');
        authUrl.searchParams.set('prompt', 'consent');  // Force refresh_token to be returned

        // Pass the clientId in state so the callback knows which app/secret to use
        authUrl.searchParams.set('state', clientId);

        console.log(`[YouTube Auth] Redirecting to OAuth. ClientId: ${clientId.substring(0, 10)}... RedirectUri: ${redirectUri}`);
        return NextResponse.redirect(authUrl.toString());
    } catch (error) {
        console.error('YouTube auth error:', error);
        return NextResponse.json(
            { error: 'Failed to initiate YouTube authentication' },
            { status: 500 }
        );
    }
}
