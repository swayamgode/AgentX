import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-util';

export interface ChannelGroupTheme {
    bgColor: string;
    bgColor2: string;        // gradient end color
    textColor: string;
    fontSizeScale: number;   // 0.3 – 1.0
    backgroundType: 'gradient' | 'plain' | 'image';
    textAlign: 'left' | 'center' | 'right';
    topics: string[];        // custom topics for this group
    style: 'random' | 'inspirational' | 'funny' | 'wisdom' | 'success';
    generationsPerChannel: number;
    geminiKey?: string;      // dedicated Gemini API key for this group
}

export interface ChannelGroup {
    id: string;
    name: string;
    channelIds: string[];    // account ids from Convex
    theme: ChannelGroupTheme;
    createdAt: string;
    updatedAt: string;
}

// GET /api/channel-groups
export async function GET() {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { ConvexHttpClient } = await import('convex/browser');
    const { api } = await import('@/convex/_generated/api');
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    const groups = await convex.query(api.youtube.listGroups, { userId: user.id });
    
    return NextResponse.json({ 
        groups: groups.map(g => ({
            ...g,
            id: g._id, // Map Convex ID to 'id' for frontend compatibility
        })) 
    });
}

// POST /api/channel-groups  — create new group
export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { ConvexHttpClient } = await import('convex/browser');
    const { api } = await import('@/convex/_generated/api');
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    const groupId = await convex.mutation(api.youtube.saveGroup, {
        userId: user.id,
        group: {
            name: body.name || 'Unnamed Group',
            channelIds: body.channelIds || [],
            theme: {
                bgColor: body.theme?.bgColor || '#000000',
                bgColor2: body.theme?.bgColor2 || '#1a1a1a',
                textColor: body.theme?.textColor || '#ffffff',
                fontSizeScale: body.theme?.fontSizeScale ?? 0.5,
                backgroundType: body.theme?.backgroundType || 'gradient',
                textAlign: body.theme?.textAlign || 'center',
                topics: body.theme?.topics || [],
                style: body.theme?.style || 'random',
                generationsPerChannel: body.theme?.generationsPerChannel ?? 5,
                geminiKey: body.theme?.geminiKey || '',
            }
        }
    });

    return NextResponse.json({ group: { id: groupId } });
}

// PUT /api/channel-groups  — update existing group
export async function PUT(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { ConvexHttpClient } = await import('convex/browser');
    const { api } = await import('@/convex/_generated/api');
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    await convex.mutation(api.youtube.saveGroup, {
        userId: user.id,
        group: {
            ...body,
            id: body.id
        }
    });

    return NextResponse.json({ success: true });
}

// DELETE /api/channel-groups?id=grp_xxx
export async function DELETE(request: NextRequest) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { ConvexHttpClient } = await import('convex/browser');
    const { api } = await import('@/convex/_generated/api');
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    await convex.mutation(api.youtube.deleteGroup, {
        userId: user.id,
        groupId: id
    });

    return NextResponse.json({ success: true });
}
