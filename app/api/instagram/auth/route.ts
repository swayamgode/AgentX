import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const appId = process.env.INSTAGRAM_APP_ID;
        const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/instagram/callback';

        if (!appId) {
            return NextResponse.json(
                { error: 'Instagram API not configured. Please add INSTAGRAM_APP_ID to environment variables.' },
                { status: 500 }
            );
        }

        // Instagram permissions
        const permissions = [
            'instagram_basic',
            'instagram_content_publish',
            'pages_show_list',
            'pages_read_engagement',
        ];

        // Build Facebook OAuth URL (Instagram uses Facebook Login)
        const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
        authUrl.searchParams.set('client_id', appId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('scope', permissions.join(','));
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('state', 'instagram_auth');

        return NextResponse.redirect(authUrl.toString());
    } catch (error) {
        console.error('Instagram auth error:', error);
        return NextResponse.json(
            { error: 'Failed to initiate Instagram authentication' },
            { status: 500 }
        );
    }
}
