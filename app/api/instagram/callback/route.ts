import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(`/?error=instagram_auth_failed&message=${error}`);
        }

        if (!code) {
            return NextResponse.redirect('/?error=instagram_auth_failed&message=no_code');
        }

        const appId = process.env.INSTAGRAM_APP_ID;
        const appSecret = process.env.INSTAGRAM_APP_SECRET;
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI?.includes('localhost')
            ? `${request.nextUrl.origin}/api/instagram/callback`
            : (process.env.INSTAGRAM_REDIRECT_URI || `${request.nextUrl.origin}/api/instagram/callback`);

        if (!appId || !appSecret) {
            return NextResponse.redirect('/?error=instagram_config_missing');
        }

        // Exchange code for access token
        const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
        tokenUrl.searchParams.set('client_id', appId);
        tokenUrl.searchParams.set('client_secret', appSecret);
        tokenUrl.searchParams.set('redirect_uri', redirectUri);
        tokenUrl.searchParams.set('code', code);

        const tokenResponse = await fetch(tokenUrl.toString());

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Token exchange failed:', errorData);
            return NextResponse.redirect('/?error=instagram_token_exchange_failed');
        }

        const tokens = await tokenResponse.json();
        const accessToken = tokens.access_token;

        // Get Instagram Business Account ID
        const accountsResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
        );

        const accountsData = await accountsResponse.json();

        if (!accountsData.data || accountsData.data.length === 0) {
            return NextResponse.redirect('/?error=no_facebook_pages');
        }

        // Get the first page's Instagram account
        const pageId = accountsData.data[0].id;
        const pageAccessToken = accountsData.data[0].access_token;

        const igAccountResponse = await fetch(
            `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
        );

        const igAccountData = await igAccountResponse.json();
        const instagramAccountId = igAccountData.instagram_business_account?.id;

        if (!instagramAccountId) {
            return NextResponse.redirect('/?error=no_instagram_business_account');
        }

        // Get Instagram account info
        const igInfoResponse = await fetch(
            `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=username&access_token=${pageAccessToken}`
        );

        const igInfo = await igInfoResponse.json();

        // Store tokens in cookies (temporary - should use database)
        const successUrl = new URL('/memes', request.nextUrl.origin);
        successUrl.searchParams.set('instagram_connected', 'true');
        successUrl.searchParams.set('instagram_username', igInfo.username || 'Instagram User');

        const response = NextResponse.redirect(successUrl.toString());
        response.cookies.set('instagram_access_token', pageAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 60, // 60 days
        });

        response.cookies.set('instagram_account_id', instagramAccountId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 60, // 60 days
        });

        return response;
    } catch (error) {
        console.error('Instagram callback error:', error);
        return NextResponse.redirect('/?error=instagram_callback_failed');
    }
}
