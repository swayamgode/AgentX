import { createClient } from '@supabase/supabase-js';
import { TwitterApi } from 'twitter-api-v2';
import cron from 'node-cron';
import * as dotenv from 'dotenv';
import { google } from 'googleapis';
import { multiAccountStorage } from '../lib/token-storage';
import { listGeneratedVideos, deleteVideo, VideoMetadata } from '../lib/video-storage';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Add delay helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
            const fileBuffer = fs.readFileSync(video.path); 

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
                        privacyStatus: 'public', 
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

            const isQuotaError = error.code === 403 && (
                error.message?.includes('quotaExceeded') ||
                error.message?.includes('dailyLimitExceeded') ||
                error.errors?.[0]?.reason === 'quotaExceeded'
            ) || (error.code === 400 && error.message?.includes('exceeded the number of videos'));

            if (isQuotaError) {
                console.log(`🛑 Quota reached for ${account.channelName}. Attempting redistribution...`);
                
                // Find alternative account
                const alternative = accounts.find(a => a.id !== account.id);
                if (alternative) {
                    console.log(`🔀 Rerouting video to alternative: ${alternative.channelName}`);
                    video.accountId = alternative.id;
                    // Will be retried on next loop with new accountId
                } else {
                    console.log(`⚠️ No alternative accounts available. Rescheduling for tomorrow.`);
                    const newDate = new Date(video.scheduledFor);
                    newDate.setDate(newDate.getDate() + 1);
                    video.scheduledFor = newDate.toISOString();
                }

                const metadataPath = video.path.replace('.webm', '.json');
                fs.writeFileSync(metadataPath, JSON.stringify(video, null, 2));
            } else {
                const metadataPath = video.path.replace('.webm', '.json');
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
    console.log(`[${new Date().toISOString()}] 🔍 Running Autonomous Stock Audit...`);

    const accounts = multiAccountStorage.getAllAccounts();
    const pendingFile = path.join(process.cwd(), 'public', 'pending-batch.json');
    const existingPending = fs.existsSync(pendingFile)
        ? JSON.parse(fs.readFileSync(pendingFile, 'utf-8'))
        : [];

    const now = new Date();
    const targetStockDays = 5; // Look ahead 5 days

    // Load topics
    const topicsFile = path.join(process.cwd(), 'topics.txt');
    let topics = ['coding', 'tech', 'humor', 'memes'];
    if (fs.existsSync(topicsFile)) {
        topics = fs.readFileSync(topicsFile, 'utf-8').split('\n').map(t => t.trim()).filter(t => t.length > 2);
    }

    let totalNewScheduled = 0;

    for (const account of accounts) {
        // Count upcoming videos for this account
        const accountUpcoming = existingPending.filter((v: any) =>
            v.accountId === account.id &&
            (v.status === 'PENDING_GENERATION' || v.status === 'GENERATED')
        );

        console.log(`Channel: ${account.channelName} | Current Stock: ${accountUpcoming.length} videos`);

        // If stock is low (less than 3 days)
        if (accountUpcoming.length < 3) {
            const needed = targetStockDays - accountUpcoming.length;
            console.log(`   ⚠️ Low Stock. Generating ${needed} new video ideas...`);

            // Generate one by one to preserve tokens
            for (let i = 0; i < needed; i++) {
                try {
                    const topic = topics[Math.floor(Math.random() * topics.length)];
                    console.log(`   ✨ [Token Safe] Generating idea for "${topic}"...`);

                    // Import directly to avoid circular deps if possible
                    const { generateBulkMemes } = await import('../lib/ai-meme-generator');
                    const [idea] = await generateBulkMemes({
                        topic,
                        count: 1,
                        includeAudio: true
                    }, process.env.GOOGLE_API_KEY || "");

                    if (idea) {
                        const scheduleDate = new Date();
                        // Offset from existing or from today
                        const offsetDays = accountUpcoming.length + i + 1;
                        scheduleDate.setDate(scheduleDate.getDate() + offsetDays);
                        scheduleDate.setHours(18, 0, 0, 0); // Default to 6 PM

                        const newTask = {
                            id: `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            accountId: account.id,
                            accountName: account.channelName,
                            scheduledFor: scheduleDate.toISOString(),
                            memeIdea: idea,
                            status: 'PENDING_GENERATION'
                        };

                        existingPending.push(newTask);
                        totalNewScheduled++;

                        // Save immediately
                        fs.writeFileSync(pendingFile, JSON.stringify(existingPending, null, 2));

                        // 🛑 TOKEN SAFETY: Sleep for 10 seconds between Gemini calls
                        console.log(`   💤 Sleeping 10s to preserve Gemini tokens...`);
                        await sleep(10000);
                    }
                } catch (err: any) {
                    console.error(`   ❌ Failed to generate idea: ${err.message}`);
                    await sleep(5000); // Sleep even on error
                }
            }
        }
    }

    if (totalNewScheduled > 0) {
        console.log(`✅ Autonomous cycle complete. Scheduled ${totalNewScheduled} new tasks.`);

        // TRIGGER BROWSER FOR RENDERING
        // On Windows, open in background. If hosted, this might open a window.
        if (process.platform === 'win32') {
             const url = 'http://localhost:3000/autopilot?auto=true';
             exec(`start "" "${url}"`);
        }
    } else {
        console.log("✅ Content stock healthy for all accounts.");
    }
}

// Run content stock audit every 4 hours
cron.schedule('0 */4 * * *', () => {
    checkAndAutoGenerateContent();
});

function updateHeartbeat(activity: string) {
    const statusPath = path.join(process.cwd(), 'scheduler-status.json');
    const status = {
        lastHeartbeat: new Date().toISOString(),
        lastActivity: activity,
        status: 'RUNNING'
    };
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

// Run every minute
cron.schedule('* * * * *', () => {
    updateHeartbeat('Checking for content to post');
    checkAndPostTweets();
    checkAndPostYouTubeContent();
});

// Handle process crashes
process.on('uncaughtException', (error) => {
    console.error('CRITICAL: Uncaught Exception:', error);
    updateHeartbeat('ERROR: Uncaught Exception');
    // Don't exit, let the cron continue if possible
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
    updateHeartbeat('ERROR: Unhandled Rejection');
});

// Run initial check
checkAndAutoGenerateContent();

console.log("Scheduler started. checking every minute...");
updateHeartbeat('Scheduler Started');
