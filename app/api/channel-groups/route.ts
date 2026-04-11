import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
    channelIds: string[];    // account ids from /api/youtube/accounts
    theme: ChannelGroupTheme;
    createdAt: string;
    updatedAt: string;
}

const DATA_PATH = path.join(process.cwd(), 'data', 'channel-groups.json');

function readGroups(): ChannelGroup[] {
    try {
        if (!fs.existsSync(DATA_PATH)) return [];
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    } catch {
        return [];
    }
}

function writeGroups(groups: ChannelGroup[]) {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(groups, null, 2));
}

// GET /api/channel-groups
export async function GET() {
    return NextResponse.json({ groups: readGroups() });
}

// POST /api/channel-groups  — create new group
export async function POST(request: NextRequest) {
    const body = await request.json();
    const groups = readGroups();

    const newGroup: ChannelGroup = {
        id: `grp_${Date.now()}`,
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
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    groups.push(newGroup);
    writeGroups(groups);

    return NextResponse.json({ group: newGroup });
}

// PUT /api/channel-groups  — update existing group
export async function PUT(request: NextRequest) {
    const body = await request.json();
    const groups = readGroups();
    const idx = groups.findIndex(g => g.id === body.id);

    if (idx === -1) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    groups[idx] = {
        ...groups[idx],
        ...body,
        theme: { ...groups[idx].theme, ...(body.theme || {}) },
        updatedAt: new Date().toISOString(),
    };

    writeGroups(groups);
    return NextResponse.json({ group: groups[idx] });
}

// DELETE /api/channel-groups?id=grp_xxx
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const groups = readGroups().filter(g => g.id !== id);
    writeGroups(groups);
    return NextResponse.json({ success: true });
}
