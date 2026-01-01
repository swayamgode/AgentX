import { TwitterApi } from "twitter-api-v2";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function generateId() {
    return crypto.randomUUID();
}

export async function POST(req: Request) {
    try {
        const { text, scheduledFor } = await req.json();

        // Helper to clean env vars
        const clean = (val: string | undefined) => val ? val.trim().replace(/^"|"$/g, '') : "";

        const appKey = clean(process.env.TWITTER_APP_KEY);
        const appSecret = clean(process.env.TWITTER_APP_SECRET);
        const accessToken = clean(process.env.TWITTER_ACCESS_TOKEN);
        const accessSecret = clean(process.env.TWITTER_ACCESS_SECRET);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Check limits
        const { count, error: countError } = await supabase
            .from('Tweet')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'POSTED')
            .gte('updatedAt', startOfMonth.toISOString());

        if (countError) {
            console.error("Error checking limits:", countError);
            // Fail open or closed? Let's fail for safety but log
        }

        if ((count || 0) >= 500) {
            return NextResponse.json({ error: "Monthly limit of 500 tweets reached." }, { status: 403 });
        }

        if (scheduledFor) {
            const date = new Date(scheduledFor);
            if (date <= now) {
                return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
            }

            const { data: tweet, error: createError } = await supabase
                .from('Tweet')
                .insert({
                    id: generateId(),
                    content: text,
                    scheduledFor: date.toISOString(),
                    status: 'SCHEDULED',
                    updatedAt: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;

            return NextResponse.json({ success: true, data: tweet });
        }

        // Immediate Post
        const client = new TwitterApi({
            appKey: appKey!,
            appSecret: appSecret!,
            accessToken: accessToken!,
            accessSecret: accessSecret!,
        });

        const rwClient = client.readWrite;
        const postedTweet = await rwClient.v2.tweet(text);

        const { data: tweet, error: createError } = await supabase
            .from('Tweet')
            .insert({
                id: generateId(),
                content: text,
                scheduledFor: now.toISOString(),
                status: 'POSTED',
                twitterId: postedTweet.data.id,
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (createError) throw createError;

        return NextResponse.json({ success: true, data: tweet });
    } catch (error) {
        console.error("Twitter post error:", error);
        return NextResponse.json(
            { error: "Failed to post to Twitter" },
            { status: 500 }
        );
    }
}
