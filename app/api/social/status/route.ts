import { NextResponse } from 'next/server';
import { tokenStorage } from '@/lib/token-storage';

export async function GET() {
    try {
        const youtubeTokens = tokenStorage.load();

        // Check if we have tokens and if they are (roughly) valid
        // We could do a more active check (e.g., call userinfo), but existence is a good first step
        const isYoutubeConnected = !!(youtubeTokens && youtubeTokens.access_token);

        // For Instagram, we'll need similar storage logic if we haven't implemented it yet.
        // For now, assuming only YouTube is using the new file-based storage.
        // If Instagram is still using cookies, we might need to check cookies here too, 
        // but the goal is to move everything to file/db storage.

        return NextResponse.json({
            youtube: {
                connected: isYoutubeConnected,
                // We could store username in the token file too if we want to display it
            },
            instagram: {
                connected: false // Placeholder until we refactor Instagram
            }
        });
    } catch (error) {
        console.error('Error checking social status:', error);
        return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
    }
}
