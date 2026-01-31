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

        // Update all tweets to SCHEDULED status
        const { data, error, count } = await supabase
            .from('Tweet')
            .update({ status: "SCHEDULED" })
            .in('id', tweetIds)
            .eq('status', 'PENDING_APPROVAL')
            .select('*'); // Select to get updated rows

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            count: data?.length || 0
        });
    } catch (error) {
        console.error("Error approving tweets:", error);
        return NextResponse.json(
            { error: "Failed to approve tweets" },
            { status: 500 }
        );
    }
}
