import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: Request) {
    try {
        const { tweetId, content } = await req.json();

        if (!tweetId || !content) {
            return NextResponse.json(
                { error: "Tweet ID and content are required" },
                { status: 400 }
            );
        }

        if (content.length > 280) {
            return NextResponse.json(
                { error: "Tweet content must be 280 characters or less" },
                { status: 400 }
            );
        }

        const { data: updatedTweet, error } = await supabase
            .from('Tweet')
            .update({ content, updatedAt: new Date().toISOString() })
            .eq('id', tweetId)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            tweet: updatedTweet
        });
    } catch (error) {
        console.error("Error updating tweet:", error);
        return NextResponse.json(
            { error: "Failed to update tweet" },
            { status: 500 }
        );
    }
}
