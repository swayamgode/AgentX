import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Reusing the path from token-storage logic
const TOKEN_FILE = path.join(process.cwd(), '.youtube-tokens.json');

export async function POST(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const platform = searchParams.get('platform');

        if (platform === 'youtube') {
            if (fs.existsSync(TOKEN_FILE)) {
                fs.unlinkSync(TOKEN_FILE);
            }
            // Also attempt to clear cookies just in case, though we primarily use file now
            const response = NextResponse.json({ success: true });
            response.cookies.set('youtube_access_token', '', { maxAge: 0 });
            response.cookies.set('youtube_refresh_token', '', { maxAge: 0 });
            return response;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Disconnect error:', error);
        return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }
}
