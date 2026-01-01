import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { encrypt, decrypt, maskApiKey } from "@/lib/encryption";

export async function GET() {
    try {
        const { data: apiKey, error } = await supabase
            .from('ApiKey')
            .select('*')
            .eq('service', 'gemini')
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error("Error fetching API key:", error);
            return NextResponse.json({ error: "Failed to fetch API key" }, { status: 500 });
        }

        if (!apiKey) {
            return NextResponse.json({ configured: false });
        }

        return NextResponse.json({
            configured: true,
            maskedKey: maskApiKey(decrypt(apiKey.key)),
            isActive: apiKey.isActive
        });
    } catch (error) {
        console.error("Error fetching API key:", error);
        return NextResponse.json(
            { error: "Failed to fetch API key" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const { apiKey } = await req.json();

        if (!apiKey || apiKey.trim().length === 0) {
            return NextResponse.json(
                { error: "API key is required" },
                { status: 400 }
            );
        }

        console.log(`Received API Key update: ${apiKey.substring(0, 5)}...`);

        const encryptedKey = encrypt(apiKey.trim());

        // Upsert the API key
        // We need to provide an ID for the INSERT case, Supabase ignores it on UPDATE if the row exists
        const { error } = await supabase
            .from('ApiKey')
            .upsert({
                id: crypto.randomUUID(), // Generate ID in case it's a new row
                service: "gemini",
                key: encryptedKey,
                isActive: true,
                updatedAt: new Date().toISOString()
            }, { onConflict: 'service' });

        if (error) {
            console.error("Error saving API key:", error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            maskedKey: maskApiKey(apiKey)
        });
    } catch (error) {
        console.error("Error saving API key:", error);
        return NextResponse.json(
            { error: "Failed to save API key" },
            { status: 500 }
        );
    }
}

export async function DELETE() {
    try {
        const { error } = await supabase
            .from('ApiKey')
            .delete()
            .eq('service', 'gemini');

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting API key:", error);
        return NextResponse.json(
            { error: "Failed to delete API key" },
            { status: 500 }
        );
    }
}
