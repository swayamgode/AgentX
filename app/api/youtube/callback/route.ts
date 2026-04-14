import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { multiAccountStorage } from '@/lib/token-storage';
import { getAuthUser } from '@/lib/auth-util';

export async function GET(request: NextRequest) {
    const origin = request.nextUrl.origin;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${origin}/api/youtube/callback`;

    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            console.error('[YouTube Callback] OAuth error from Google:', error);
            return NextResponse.redirect(new URL('/settings?error=youtube_auth_denied', request.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
        }

        const { keyManager } = await import('@/lib/key-manager');
        const stateClientId = searchParams.get('state');

        let clientId = stateClientId || process.env.YOUTUBE_CLIENT_ID;
        let clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

        // Find the matching app credentials from keyManager
        if (stateClientId) {
            const apps = keyManager.getAllYouTubeApps();
            const matchingApp = apps.find(a => a.id === stateClientId);
            if (matchingApp) {
                clientId = matchingApp.id;
                clientSecret = matchingApp.secret;
                console.log(`[YouTube Callback] Matched app from state: ${clientId.substring(0, 10)}...`);
            } else if (stateClientId === process.env.YOUTUBE_CLIENT_ID) {
                // Primary app — secret already set from env
                console.log(`[YouTube Callback] Using primary env app: ${clientId?.substring(0, 10)}...`);
            } else {
                console.warn(`[YouTube Callback] No app found for state clientId: ${stateClientId?.substring(0, 10)}... — falling back to env credentials`);
                // Still try with env creds as fallback
            }
        }

        if (!clientId || !clientSecret) {
            console.error('[YouTube Auth] Missing Client ID or Client Secret at callback');
            return NextResponse.redirect(new URL(`/settings?error=auth_failed&msg=${encodeURIComponent(`Missing API credentials. ID: ${clientId?.substring(0, 10)}... Link: ${redirectUri}`)}`, request.url));
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            redirectUri
        );

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        if (!tokens.access_token) {
            console.error('[YouTube Callback] No access_token in token response');
            return NextResponse.redirect(new URL('/settings?error=auth_failed&msg=No+access+token+returned', request.url));
        }

        if (!tokens.refresh_token) {
            console.warn('[YouTube Callback] No refresh_token returned. This account may not re-authenticate automatically. Ensure prompt=consent was set.');
        }

        // Fetch channel information
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const channelResponse = await youtube.channels.list({
            part: ['snippet', 'contentDetails'],
            mine: true
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            console.error('[YouTube Callback] No YouTube channel found for this account');
            return NextResponse.redirect(new URL('/settings?error=no_channel&msg=No+YouTube+channel+found+on+this+Google+account', request.url));
        }

        const channel = channelResponse.data.items[0];
        const channelName = channel.snippet?.title || 'Unknown Channel';
        const channelId = channel.id || 'unknown';
        const thumbnailUrl = channel.snippet?.thumbnails?.default?.url;

        // Fetch user email — wrapped in try/catch since scope may be absent on re-auth
        let email = 'unknown';
        try {
            const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
            const userInfo = await oauth2.userinfo.get();
            email = userInfo.data.email || 'unknown';
        } catch (emailErr: any) {
            console.warn('[YouTube Callback] Could not fetch email (scope may be missing):', emailErr.message);
        }

        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        await multiAccountStorage.addAccount(userId, {
            channelName,
            channelId,
            email,
            watermark: channelName, // Default watermark is channel name
            thumbnailUrl: thumbnailUrl ?? undefined,
            tokens: {
                access_token: tokens.access_token!,
                refresh_token: tokens.refresh_token || undefined,
                expiry_date: tokens.expiry_date || undefined
            },
            appCredentials: {
                clientId: clientId!,
                clientSecret: clientSecret!
            }
        });

        console.log(`✅ YouTube account connected: ${channelName} (${email}), refresh_token: ${!!tokens.refresh_token}, expiry: ${tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'unknown'}`);

        return NextResponse.redirect(new URL('/settings?success=youtube_connected', request.url));
    } catch (error: any) {
        console.error('[YouTube Callback] Error details:', {
            message: error.message,
            code: error.code,
            response: error.response?.data,
        });
        return NextResponse.redirect(new URL(`/settings?error=auth_failed&msg=${encodeURIComponent(`${error.message || 'Unknown error'} (Redirect URI: ${redirectUri})`)}`, request.url));
    }
}
