import { createClient } from '@supabase/supabase-js';
import { TwitterApi } from 'twitter-api-v2';
import cron from 'node-cron';
import * as dotenv from 'dotenv';
import { google } from 'googleapis';
import { multiAccountStorage } from '../lib/token-storage';
import { listGeneratedVideos, deleteVideo, VideoMetadata } from '../lib/video-storage';
import * as fs from 'fs';
import * as path from 'path';

// Load .env first (for DATABASE_URL), then .env.local (for Twitter/YouTube credentials)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Helper to clean env vars
const clean = (val: string | undefined) => val ? val.trim().replace(/^"|"$/g, '') : "";

const appKey = clean(process.env.TWITTER_APP_KEY);
const appSecret = clean(process.env.TWITTER_APP_SECRET);
const accessToken = clean(process.env.TWITTER_ACCESS_TOKEN);
const accessSecret = clean(process.env.TWITTER_ACCESS_SECRET);

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const youtubeClientId = clean(process.env.YOUTUBE_CLIENT_ID);
const youtubeClientSecret = clean(process.env.YOUTUBE_CLIENT_SECRET);
const youtubeRedirectUri = clean(process.env.YOUTUBE_REDIRECT_URI);


if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const client = (appKey && appSecret && accessToken && accessSecret) ? new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
}) : null;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndPostTweets() {
    if (!client) return;

    console.log(`[${new Date().toISOString()}] Checking for scheduled tweets...`);

    try {
        const now = new Date();

        // Find scheduled tweets
        const { data: tweetsToPost, error: fetchError } = await supabase
            .from('Tweet')
            .select('*')
            .eq('status', 'SCHEDULED')
            .lte('scheduledFor', now.toISOString());

        if (fetchError) {
            console.error("Error fetching tweets:", fetchError);
            return;
        }

        if (!tweetsToPost || tweetsToPost.length === 0) {
            return;
        }

        console.log(`Found ${tweetsToPost.length} tweets to post.`);

        for (const tweet of tweetsToPost) {
            try {
                // Check monthly limit (simple check)
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                const { count, error: countError } = await supabase
                    .from('Tweet')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'POSTED')
                    .gte('updatedAt', startOfMonth.toISOString());

                if (countError) {
                    console.error("Error checking limit:", countError);
                    continue;
                }

                if ((count || 0) >= 500) {
                    console.error(`Monthly limit reached. Skipping tweet ${tweet.id}`);
                    await supabase
                        .from('Tweet')
                        .update({ status: 'FAILED' })
                        .eq('id', tweet.id);
                    continue;
                }

                const postedTweet = await client.readWrite.v2.tweet(tweet.content);
                console.log(`Posted tweet ${tweet.id}: ${postedTweet.data.id}`);

                await supabase
                    .from('Tweet')
                    .update({
                        status: 'POSTED',
                        twitterId: postedTweet.data.id,
                        updatedAt: new Date().toISOString()
                    })
                    .eq('id', tweet.id);

            } catch (error) {
                console.error(`Failed to post tweet ${tweet.id}:`, error);
                await supabase
                    .from('Tweet')
                    .update({ status: 'FAILED' })
                    .eq('id', tweet.id);
            }
        }

    } catch (error) {
        console.error("Error in scheduler loop:", error);
    }
}

async function checkAndPostYouTubeContent() {
    console.log(`[${new Date().toISOString()}] Checking for scheduled YouTube videos...`);

    if (!youtubeClientId || !youtubeClientSecret) {
        console.error("Missing YouTube Client ID/Secret");
        return;
    }

    const videos = listGeneratedVideos();
    const now = new Date();

    // Filter for scheduled videos that are ready to post (and not already uploaded)
    const pendingVideos = videos.filter(v => {
        return (v.status === 'SCHEDULED' || !v.status) && new Date(v.scheduledFor) <= now;
    });

    if (pendingVideos.length === 0) {
        return;
    }

    console.log(`Found ${pendingVideos.length} YouTube videos to post.`);

    for (const video of pendingVideos) {
        // Assume default account if not specified, or skip
        if (!video.accountId) {
            const active = multiAccountStorage.getActiveAccount();
            if (active) video.accountId = active.id;
            else {
                console.error(`Skipping video ${video.filename}: No account ID`);
                continue;
            }
        }

        const account = multiAccountStorage.getAccount(video.accountId!);
        if (!account) {
            console.error(`Account not found: ${video.accountId}`);
            continue;
        }

        try {
            const oauth2Client = new google.auth.OAuth2(
                youtubeClientId,
                youtubeClientSecret,
                youtubeRedirectUri
            );

            oauth2Client.setCredentials({
                access_token: account.tokens.access_token,
                refresh_token: account.tokens.refresh_token,
                expiry_date: account.tokens.expiry_date
            });

            // Refresh token if needed
            const tokenInfo = await oauth2Client.getAccessToken();
            if (tokenInfo.token) {
                // Save new tokens if refreshed
                if (tokenInfo.token !== account.tokens.access_token && tokenInfo.res?.data) {
                    multiAccountStorage.updateTokens(account.id, {
                        access_token: tokenInfo.token,
                        expiry_date: tokenInfo.res.data.expiry_date,
                        refresh_token: tokenInfo.res.data.refresh_token // might be undefined, that's ok
                    });
                }
            } else {
                console.error(`Failed to refresh token for ${account.channelName}`);
                continue;
            }

            const youtube = google.youtube({
                version: 'v3',
                auth: oauth2Client
            });

            // Read file
            const fileBuffer = fs.readFileSync(video.path); // video.path should be absolute

            console.log(`Uploading ${video.filename} to ${account.channelName}...`);

            const response = await youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: video.title,
                        description: video.description,
                        tags: video.tags,
                        categoryId: '23',
                    },
                    status: {
                        privacyStatus: 'public', // User requested upload
                        selfDeclaredMadeForKids: false,
                    },
                },
                media: {
                    body: streamFromBuffer(fileBuffer),
                },
            });

            console.log(`Uploaded! ID: ${response.data.id}`);

            // Update Metadata
            const metadataPath = video.path.replace('.webm', '.json');
            const newMetadata = {
                ...video,
                status: 'UPLOADED',
                youtubeId: response.data.id,
                uploadedAt: new Date().toISOString()
            };

            fs.writeFileSync(metadataPath, JSON.stringify(newMetadata, null, 2));

        } catch (error: any) {
            console.error(`Failed to upload ${video.filename}:`, error.message);

            // Check for quota exceeded error
            const isQuotaError = error.code === 403 && (
                error.message?.includes('quotaExceeded') ||
                error.message?.includes('dailyLimitExceeded') ||
                error.errors?.[0]?.reason === 'quotaExceeded'
            ) || (error.code === 400 && error.message?.includes('exceeded the number of videos'));

            const metadataPath = video.path.replace('.webm', '.json');

            if (isQuotaError) {
                console.log(`Quota reached for ${account.channelName}. Rescheduling video for tomorrow...`);
                // Reschedule for 24 hours later
                const newDate = new Date(video.scheduledFor);
                newDate.setDate(newDate.getDate() + 1);

                const rescheduledMetadata = {
                    ...video,
                    status: 'SCHEDULED',
                    scheduledFor: newDate.toISOString(),
                    retryCount: (video.retryCount || 0) + 1
                };
                fs.writeFileSync(metadataPath, JSON.stringify(rescheduledMetadata, null, 2));
            } else {
                // Update status to FAILED for non-quota errors
                const failedMetadata: VideoMetadata = {
                    ...video,
                    status: 'FAILED',
                    error: error.message
                };
                fs.writeFileSync(metadataPath, JSON.stringify(failedMetadata, null, 2));
            }
        }
    }
}

// Simple buffer stream helper
import { Readable } from 'stream';
function streamFromBuffer(buffer: Buffer) {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

import { exec } from 'child_process';

async function checkAndAutoGenerateContent() {
    console.log(`[${new Date().toISOString()}] Checking content stock...`);

    const videos = listGeneratedVideos();
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 2); // Look ahead 2 days

    const upcomingVideos = videos.filter(v =>
        (v.status === 'SCHEDULED' || !v.status) &&
        new Date(v.scheduledFor) > now &&
        new Date(v.scheduledFor) < tomorrow
    );

    console.log(`Upcoming videos (next 48h): ${upcomingVideos.length}`);

    // If we have fewer than 3 videos for the next 2 days, trigger auto-pilot
    if (upcomingVideos.length < 3) {
        console.log("Content stock low! Triggering Auto-Pilot generation...");

        // On Windows, use 'start' to open the default browser
        // We assume the dev server is running on localhost:3000
        const url = 'http://localhost:3000/autopilot?auto=true';
        const command = `start "" "${url}"`;

        exec(command, (error) => {
            if (error) {
                console.error('Failed to trigger auto-pilot:', error);
            } else {
                console.log('Successfully launched Auto-Pilot in browser.');
            }
        });
    }
}

// Run content check every 6 hours
cron.schedule('0 */6 * * *', () => {
    checkAndAutoGenerateContent();
});

// Run every minute
cron.schedule('* * * * *', () => {
    checkAndPostTweets();
    checkAndPostYouTubeContent();
});

// Run initial check
checkAndAutoGenerateContent();

console.log("Scheduler started. checking every minute...");
