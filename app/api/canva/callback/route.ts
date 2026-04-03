
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.json({ error: `Canva Auth Error: ${error}` }, { status: 400 });
    }

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const clientId = process.env.CANVA_CLIENT_ID;
    const clientSecret = process.env.CANVA_CLIENT_SECRET;
    const redirectUri = process.env.CANVA_REDIRECT_URI?.includes('localhost')
        ? `${req.nextUrl.origin}/api/canva/callback`
        : (process.env.CANVA_REDIRECT_URI || `${req.nextUrl.origin}/api/canva/callback`);

    try {
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

        const response = await fetch("https://www.canva.com/api/oauth/v1/token", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code: code,
                redirect_uri: redirectUri,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Canva Token Error:", data);
            return NextResponse.json({ error: "Failed to exchange token", details: data }, { status: 500 });
        }

        // Success! We have access_token and refresh_token.
        // In a real app, save to DB linked to user.
        // Here, we set a cookie and redirect to home.

        const res = NextResponse.redirect(new URL("/", req.url));

        // Set cookie (httpOnly for security, but allow script access for demo if needed or use NextJS cookies)
        res.cookies.set("canva_access_token", data.access_token, {
            httpOnly: false, // We might want to read it in client to check connection status
            secure: process.env.NODE_ENV === "production",
            maxAge: data.expires_in,
            path: "/",
        });

        return res;

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
