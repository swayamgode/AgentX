import { NextResponse, NextRequest } from 'next/server';
import { tokenStorage } from '@/lib/token-storage';
import { getAuthUser } from '@/lib/auth-util';

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser();
        const userId = user?.id || 'dev-id-001';
        const youtubeTokens = tokenStorage.load(userId);
        const isYoutubeConnected = !!(youtubeTokens && youtubeTokens.access_token);

        const instagramToken = req.cookies.get('instagram_access_token')?.value;
        const instagramId = req.cookies.get('instagram_account_id')?.value;
        const isInstagramConnected = !!(instagramToken && instagramId);

        return NextResponse.json({
            youtube: {
                connected: isYoutubeConnected,
            },
            instagram: {
                connected: isInstagramConnected,
                // We could store username in a separate cookie if we wanted
            }
        });
    } catch (error) {
        console.error('Error checking social status:', error);
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
}
