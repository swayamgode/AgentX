import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const tokensPath = path.join(process.cwd(), 'data', 'tokens.json');

export function getTokens(): any[] {
    if (!fs.existsSync(tokensPath)) return [];
    try {
        return JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
    } catch {
        return [];
    }
}

export function addToken(token: any) {
    const tokens = getTokens();
    
    // Check if we already have this access_token to prevent duplicates
    if (!tokens.some(t => t.access_token === token.access_token)) {
        tokens.push(token);
        const dir = path.dirname(tokensPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
    }
}

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/?error=NoCode', req.url));
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.YOUTUBE_CLIENT_ID,
            process.env.YOUTUBE_CLIENT_SECRET,
            process.env.YOUTUBE_REDIRECT_URI || "http://localhost:3001/api/youtube/callback"
        );

        const { tokens } = await oauth2Client.getToken(code);
        
        // Save token to array
        addToken(tokens);
        
        // Redirect back to dashboard safely
        return NextResponse.redirect(new URL('/', req.url));
        
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.redirect(new URL('/?error=AuthFailed', req.url));
    }
}
