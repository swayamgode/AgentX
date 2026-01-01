import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch tweets ordered by date
        const tweetsPromise = supabase
            .from('Tweet')
            .select('*')
            .order('createdAt', { ascending: false });

        // Count posted tweets this month
        const countPromise = supabase
            .from('Tweet')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'POSTED')
            .gte('updatedAt', startOfMonth.toISOString());

        // Execute in parallel
        const [tweetsResponse, countResponse] = await Promise.all([
            tweetsPromise,
            countPromise
        ]);

        if (tweetsResponse.error) throw tweetsResponse.error;
        if (countResponse.error) throw countResponse.error;

        return NextResponse.json({
            tweets: tweetsResponse.data || [],
            usage: {
                used: countResponse.count || 0,
                limit: 500
            }
        });
    } catch (error) {
        console.error("Error fetching tweets:", error);
        return NextResponse.json(
            { error: "Failed to fetch tweets" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const { id, content, scheduledFor } = await req.json();

        const updateData: any = {
            content,
            updatedAt: new Date().toISOString()
        };

        if (scheduledFor) {
            updateData.scheduledFor = new Date(scheduledFor).toISOString();
        }

        const { data: updatedTweet, error } = await supabase
            .from('Tweet')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true, tweet: updatedTweet });
    } catch (error) {
        console.error("Error updating tweet:", error);
        return NextResponse.json({ error: "Failed to update tweet" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const { error } = await supabase
            .from('Tweet')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting tweet:", error);
        return NextResponse.json({ error: "Failed to delete tweet" }, { status: 500 });
    }
}
