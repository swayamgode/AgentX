import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!appKey || !appSecret || !accessToken || !accessSecret) {
    console.error("Missing Twitter credentials in .env.local");
    process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const client = new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessSecret,
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndPostTweets() {
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

// Run every minute
cron.schedule('* * * * *', checkAndPostTweets);

console.log("Scheduler started. checking every minute...");
