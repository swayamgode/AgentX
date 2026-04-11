import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
    const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || "http://localhost:3001/api/youtube/callback";

    if (!CLIENT_ID) {
        return NextResponse.json({ error: "Missing YOUTUBE_CLIENT_ID in .env.local" }, { status: 500 });
    }

    const scope = "https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.readonly";
    
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.append("client_id", CLIENT_ID);
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append("access_type", "offline");
    authUrl.searchParams.append("prompt", "consent");

    return NextResponse.redirect(authUrl.toString());
}
