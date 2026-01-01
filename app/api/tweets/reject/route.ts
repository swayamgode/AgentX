import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const { tweetIds } = await req.json();

        if (!Array.isArray(tweetIds) || tweetIds.length === 0) {
            return NextResponse.json(
                { error: "Tweet IDs array is required" },
                { status: 400 }
            );
        }

        // Delete rejected tweets
        const { data, error } = await supabase
            .from('Tweet')
            .delete()
            .in('id', tweetIds)
            .eq('status', 'PENDING_APPROVAL')
            .select();

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            count: data?.length || 0
        });
    } catch (error) {
        console.error("Error rejecting tweets:", error);
        return NextResponse.json(
            { error: "Failed to reject tweets" },
            { status: 500 }
        );
    }
}
