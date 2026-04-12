import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { multiAccountStorage } from '@/lib/token-storage';
import { getAuthUser } from '@/lib/auth-util';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(new URL('/settings?error=youtube_auth_denied', request.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
        }

        const { keyManager } = await import('@/lib/key-manager');
        const stateClientId = searchParams.get('state');
        
        let clientId = stateClientId || process.env.YOUTUBE_CLIENT_ID;
        let clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

        // If we have multiple apps, find the one that matches this clientId
        if (stateClientId) {
            const apps = keyManager.getAllYouTubeApps();
            const matchingApp = apps.find(a => a.id === stateClientId);
            if (matchingApp) {
                clientId = matchingApp.id;
                clientSecret = matchingApp.secret;
            } else if (stateClientId === process.env.YOUTUBE_CLIENT_ID) {
                // It's the primary app, secret is already set
            } else {
                console.warn(`[YouTube Callback] Received state with clientId ${stateClientId} but no matching secret found in keyManager.`);
            }
        }

        if (!clientId || !process.env.YOUTUBE_CLIENT_SECRET) {
            console.error('[YouTube Auth] Missing Client ID or Client Secret');
            return NextResponse.redirect(new URL(`/settings?error=auth_failed&msg=${encodeURIComponent(`Missing API credentials. ID: ${clientId?.substring(0, 10)}... Link: ${redirectUri}`)}`, request.url));
        }

        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            process.env.YOUTUBE_REDIRECT_URI || `${request.nextUrl.origin}/api/youtube/callback`
        );

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Fetch channel information
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const channelResponse = await youtube.channels.list({
            part: ['snippet', 'contentDetails'],
            mine: true
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            return NextResponse.redirect(new URL('/settings?error=no_channel', request.url));
        }

        const channel = channelResponse.data.items[0];
        const channelName = channel.snippet?.title || 'Unknown Channel';
        const channelId = channel.id || 'unknown';
        const thumbnailUrl = channel.snippet?.thumbnails?.default?.url;

        // Fetch user email
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email || 'unknown';

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

        console.log('✅ YouTube account connected and synced to Convex:', channelName);

        return NextResponse.redirect(new URL('/settings?success=youtube_connected', request.url));
    } catch (error: any) {
        const origin = request.nextUrl.origin;
        const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${origin}/api/youtube/callback`;
            
        console.error('YouTube callback error details:', error);
        return NextResponse.redirect(new URL(`/settings?error=auth_failed&msg=${encodeURIComponent(`${error.message || 'Unknown error'} (Link: ${redirectUri})`)}`, request.url));
    }
}
