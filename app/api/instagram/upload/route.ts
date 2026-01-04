import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Get credentials from cookies
        const accessToken = request.cookies.get('instagram_access_token')?.value;
        const accountId = request.cookies.get('instagram_account_id')?.value;

        if (!accessToken || !accountId) {
            return NextResponse.json(
                { error: 'Not authenticated. Please connect your Instagram account first.' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const videoFile = formData.get('video') as File;
        const caption = formData.get('caption') as string || 'Created with AgentX Meme Studio 🎬';
        const shareToFeed = formData.get('shareToFeed') === 'true';

        if (!videoFile) {
            return NextResponse.json(
                { error: 'No video file provided' },
                { status: 400 }
            );
        }

        // Note: Instagram requires the video to be hosted on a publicly accessible URL
        // For production, you'd upload to a CDN first
        // For now, we'll return instructions for manual upload

        // This is a simplified version - in production you need to:
        // 1. Upload video to a public CDN (AWS S3, Cloudinary, etc.)
        // 2. Use the public URL with Instagram API

        return NextResponse.json({
            success: false,
            error: 'Instagram API requires video to be hosted on a public URL. Please use the download feature and upload manually to Instagram.',
            instructions: [
                '1. Click "Download" to save your meme reel',
                '2. Open Instagram app on your phone',
                '3. Tap + to create a new Reel',
                '4. Upload the downloaded video',
                '5. Add your caption and publish!',
            ],
            alternativeMethod: 'We recommend using the download feature for now. Full Instagram integration requires additional infrastructure.',
        });

        // Production code would look like this:
        /*
        // Step 1: Create media container
        const containerResponse = await fetch(
          `https://graph.facebook.com/v18.0/${accountId}/media`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              media_type: 'REELS',
              video_url: publicVideoUrl, // URL to publicly hosted video
              caption,
              share_to_feed: shareToFeed,
              access_token: accessToken,
            }),
          }
        );
    
        const containerData = await containerResponse.json();
        
        if (!containerData.id) {
          throw new Error('Failed to create media container');
        }
    
        const creationId = containerData.id;
    
        // Step 2: Publish the reel
        const publishResponse = await fetch(
          `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              creation_id: creationId,
              access_token: accessToken,
            }),
          }
        );
    
        const publishData = await publishResponse.json();
    
        return NextResponse.json({
          success: true,
          mediaId: publishData.id,
          message: 'Reel published successfully to Instagram!',
        });
        */

    } catch (error: any) {
        console.error('Instagram upload error:', error);

        return NextResponse.json(
            { error: error.message || 'Failed to upload to Instagram' },
            { status: 500 }
        );
    }
}
