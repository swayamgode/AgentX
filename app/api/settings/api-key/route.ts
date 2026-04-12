import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-util';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const settings = await convex.query(api.youtube.getSettings, { userId: user.id });
        
        if (settings?.geminiKey) {
            const key = settings.geminiKey;
            const maskedKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
            return NextResponse.json({ configured: true, maskedKey });
        }

        return NextResponse.json({ configured: false });
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { apiKey } = body;

        if (!apiKey) return NextResponse.json({ error: 'API Key is required' }, { status: 400 });

        await convex.mutation(api.youtube.updateSettings, {
            userId: user.id,
            settings: { geminiKey: apiKey }
        });

        const maskedKey = apiKey.substring(0, 6) + '...' + apiKey.substring(apiKey.length - 4);
        return NextResponse.json({ success: true, maskedKey, configured: true });
    } catch (error) {
        console.error('Failed to save settings:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
