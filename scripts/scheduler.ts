import { prisma } from '../lib/db';
import { TwitterApi } from 'twitter-api-v2';
import cron from 'node-cron';
import * as dotenv from 'dotenv';

// Load .env first (for DATABASE_URL), then .env.local (for Twitter credentials)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Helper to clean env vars
const clean = (val: string | undefined) => val ? val.trim().replace(/^"|"$/g, '') : "";

const appKey = clean(process.env.TWITTER_APP_KEY);
const appSecret = clean(process.env.TWITTER_APP_SECRET);
const accessToken = clean(process.env.TWITTER_ACCESS_TOKEN);
const accessSecret = clean(process.env.TWITTER_ACCESS_SECRET);

if (!appKey || !appSecret || !accessToken || !accessSecret) {
    console.error("Missing Twitter credentials in .env.local");
    process.exit(1);
}

const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
});

async function checkAndPostTweets() {
    console.log(`[${new Date().toISOString()}] Checking for scheduled tweets...`);

    try {
        const now = new Date();
        const tweetsToPost = await prisma.tweet.findMany({
            where: {
                status: 'SCHEDULED',
                scheduledFor: {
                    lte: now
                }
            }
        });

        if (tweetsToPost.length === 0) {
            return;
        }

        console.log(`Found ${tweetsToPost.length} tweets to post.`);

        for (const tweet of tweetsToPost) {
            try {
                // Check monthly limit (simple check)
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const count = await prisma.tweet.count({
                    where: {
                        status: 'POSTED',
                        updatedAt: { gte: startOfMonth }
                    }
                });

                if (count >= 500) {
                    console.error(`Monthly limit reached. Skipping tweet ${tweet.id}`);
                    await prisma.tweet.update({
                        where: { id: tweet.id },
                        data: { status: 'FAILED' } // Or keep SCHEDULED? Failed for now.
                    });
                    continue;
                }

                const postedTweet = await client.readWrite.v2.tweet(tweet.content);
                console.log(`Posted tweet ${tweet.id}: ${postedTweet.data.id}`);

                await prisma.tweet.update({
                    where: { id: tweet.id },
                    data: {
                        status: 'POSTED',
                        twitterId: postedTweet.data.id
                    }
                });

            } catch (error) {
                console.error(`Failed to post tweet ${tweet.id}:`, error);
                await prisma.tweet.update({
                    where: { id: tweet.id },
                    data: { status: 'FAILED' }
                });
            }
        }

    } catch (error) {
        console.error("Error in scheduler loop:", error);
    }
}

// Run every minute
cron.schedule('* * * * *', checkAndPostTweets);

console.log("Scheduler started. checking every minute...");
