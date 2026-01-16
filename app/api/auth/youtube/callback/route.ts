import { NextRequest, NextResponse } from 'next/server';
import { multiAccountStorage } from '@/lib/token-storage';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(new URL('/settings?error=youtube_auth_denied&message=' + error, request.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
        }

        const clientId = process.env.YOUTUBE_CLIENT_ID;
        const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
        const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/auth/youtube/callback';

        if (!clientId || !clientSecret) {
            return NextResponse.redirect(new URL('/settings?error=youtube_config_missing', request.url));
        }

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
            return NextResponse.redirect(new URL('/settings?error=auth_failed', request.url));
        }

        const tokens = await tokenResponse.json();

        // 1. Get User Email (from userinfo)
        let email = 'unknown@email.com';
        try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokens.access_token}` },
            });
            if (userRes.ok) {
                const userData = await userRes.json();
                email = userData.email || email;
            }
        } catch (e) {
            console.warn('Failed to fetch user email:', e);
        }

        // 2. Get Channel Details (from YouTube Data API)
        const channelRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });

        if (!channelRes.ok) {
            console.error('Failed to fetch channel info:', await channelRes.text());
            return NextResponse.redirect(new URL('/settings?error=no_channel', request.url));
        }

        const channelData = await channelRes.json();
        const validChannel = channelData.items?.[0];

        if (!validChannel) {
            return NextResponse.redirect(new URL('/settings?error=no_channel', request.url));
        }

        // 3. Prepare Account Data
        const channelId = validChannel.id;
        const channelName = validChannel.snippet.title;
        const thumbnailUrl = validChannel.snippet.thumbnails?.default?.url;

        // 4. Check if account already exists
        const allAccounts = multiAccountStorage.getAllAccounts();
        const existingAccount = allAccounts.find(acc => acc.channelId === channelId);

        if (existingAccount) {
            // Update existing account
            multiAccountStorage.updateAccount(existingAccount.id, {
                channelName,
                email, // Update email in case it changed
                thumbnailUrl,
                tokens: {
                    ...existingAccount.tokens, // Keep old tokens if new ones missing (e.g. refresh_token might not be sent on every flow)
                    ...tokens,
                }
            });
            // Ensure we update the refresh token if provided
            if (tokens.refresh_token) {
                multiAccountStorage.updateTokens(existingAccount.id, { refresh_token: tokens.refresh_token });
            }
        } else {
            // Add new account
            multiAccountStorage.addAccount({
                channelName,
                channelId,
                email,
                watermark: '@AgentX', // Default watermark
                thumbnailUrl,
                tokens,
            });
        }

        // Redirect back to settings with success
        const successUrl = new URL('/settings', request.url);
        successUrl.searchParams.set('success', 'youtube_connected');
        return NextResponse.redirect(successUrl);

    } catch (error) {
        console.error('YouTube callback error:', error);
        return NextResponse.redirect(new URL('/settings?error=auth_failed', request.url));
    }
}
