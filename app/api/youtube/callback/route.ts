import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { multiAccountStorage } from '@/lib/token-storage';
import fs from 'fs';
import path from 'path';

function logDebug(message: string, data?: any) {
    try {
        const logFile = path.join(process.cwd(), 'debug-social.log');
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
        fs.appendFileSync(logFile, logEntry);
    } catch (e) {
        console.error('Failed to write debug log', e);
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        logDebug('Callback received', { code: code ? 'PRESENT' : 'MISSING', error });

        if (error) {
            logDebug('Auth error from Google', error);
            return NextResponse.redirect(new URL('/settings?error=youtube_auth_denied', request.url));
        }

        if (!code) {
            logDebug('No code returned');
            return NextResponse.redirect(new URL('/settings?error=no_code', request.url));
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback'
        );

        // Exchange code for tokens
        logDebug('Exchanging code for tokens...');
        const { tokens } = await oauth2Client.getToken(code);
        logDebug('Tokens received');
        oauth2Client.setCredentials(tokens);

        // Fetch channel information
        logDebug('Fetching channel info...');
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
        const channelResponse = await youtube.channels.list({
            part: ['snippet', 'contentDetails'],
            mine: true
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            logDebug('No channel found');
            return NextResponse.redirect(new URL('/settings?error=no_channel', request.url));
        }

        const channel = channelResponse.data.items[0];
        const channelName = channel.snippet?.title || 'Unknown Channel';
        const channelId = channel.id || 'unknown';
        const thumbnailUrl = channel.snippet?.thumbnails?.default?.url;

        logDebug('Channel found', { channelName, channelId });

        // Fetch user email
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email || 'unknown';

        // Add account to storage
        logDebug('Saving account...');
        const newAccount = multiAccountStorage.addAccount({
            channelName,
            channelId,
            email,
            watermark: channelName, // Default watermark is channel name
            thumbnailUrl: thumbnailUrl ?? undefined,
            tokens: {
                access_token: tokens.access_token!,
                refresh_token: tokens.refresh_token || undefined,
                expiry_date: tokens.expiry_date || undefined
            }
        });

        logDebug('Account saved', newAccount.id);
        console.log('✅ YouTube account connected:', channelName);

        return NextResponse.redirect(new URL('/settings?success=youtube_connected', request.url));
    } catch (error) {
        logDebug('Callback Exception', error);
        console.error('YouTube callback error:', error);
        return NextResponse.redirect(new URL('/settings?error=auth_failed', request.url));
    }
}
