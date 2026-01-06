import { NextRequest, NextResponse } from 'next/server';
import { tokenStorage } from '@/lib/token-storage';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(new URL('/memes?error=youtube_auth_failed&message=' + error, request.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL('/memes?error=youtube_auth_failed&message=no_code', request.url));
        }

        const clientId = process.env.YOUTUBE_CLIENT_ID;
        const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        // Default to the path that matches Google Console (inferred from error)
        const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/youtube/callback';

        if (!clientId || !clientSecret) {
            return NextResponse.redirect(new URL('/memes?error=youtube_config_missing', request.url));
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Token exchange failed:', errorData);
            return NextResponse.redirect(new URL('/memes?error=youtube_token_exchange_failed', request.url));
        }

        const tokens = await tokenResponse.json();

        // Save to persistent storage
        tokenStorage.save(tokens);

        // Get user info for UI
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        const userInfo = await userInfoResponse.json();

        // Redirect back to memes page
        const successUrl = new URL('/memes', request.url);
        successUrl.searchParams.set('youtube_connected', 'true');
        return NextResponse.redirect(successUrl);

    } catch (error) {
        console.error('YouTube callback error:', error);
        return NextResponse.redirect(new URL('/memes?error=youtube_callback_failed', request.url));
    }
}
