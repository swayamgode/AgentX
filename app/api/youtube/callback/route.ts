import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(`/?error=youtube_auth_failed&message=${error}`);
        }

        if (!code) {
            return NextResponse.redirect('/?error=youtube_auth_failed&message=no_code');
        }

        const clientId = process.env.YOUTUBE_CLIENT_ID;
        const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';

        if (!clientId || !clientSecret) {
            return NextResponse.redirect('/?error=youtube_config_missing');
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
            return NextResponse.redirect('/?error=youtube_token_exchange_failed');
        }

        const tokens = await tokenResponse.json();

        // Get user info
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        const userInfo = await userInfoResponse.json();

        // Store tokens in localStorage via redirect with tokens in URL (temporary solution)
        // In production, store in database
        const successUrl = new URL('/memes', request.nextUrl.origin);
        successUrl.searchParams.set('youtube_connected', 'true');
        successUrl.searchParams.set('youtube_name', userInfo.name || 'YouTube User');

        // Store tokens in cookie (temporary - should use database)
        const response = NextResponse.redirect(successUrl.toString());
        response.cookies.set('youtube_access_token', tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: tokens.expires_in || 3600,
        });

        if (tokens.refresh_token) {
            response.cookies.set('youtube_refresh_token', tokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 24 * 30, // 30 days
            });
        }

        return response;
    } catch (error) {
        console.error('YouTube callback error:', error);
        return NextResponse.redirect('/?error=youtube_callback_failed');
    }
}
