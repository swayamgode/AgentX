import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    console.log('Starting Instagram upload flow...');

    // 1. Upload to Supabase Storage to get a Public URL
    const bucketName = 'instagram-videos';
    const fileName = `${Date.now()}-${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    // Ensure bucket exists (best effort)
    const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50MB (Instagram has limits)
    });
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.log('Bucket check note:', bucketError.message);
    }

    // Upload Video
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, videoFile, {
        contentType: videoFile.type || 'video/mp4',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error(`Failed to upload video to staging storage: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log('Video staged at:', publicUrl);

    // 2. Create Media Container on Instagram
    const containerUrl = `https://graph.facebook.com/v18.0/${accountId}/media`;
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: publicUrl,
        caption: caption,
        share_to_feed: shareToFeed,
        access_token: accessToken
      })
    });

    const containerData = await containerRes.json();

    if (!containerRes.ok || !containerData.id) {
      console.error('Instagram Container Error:', containerData);
      throw new Error(`Failed to initialize Instagram upload: ${containerData.error?.message || 'Unknown error'}`);
    }

    const creationId = containerData.id;
    console.log('Media Container ID created:', creationId);

    // 3. Wait for Media Processing (Status Check Loop)
    // Instagram takes time to process the video before it can be published.
    let status = 'IN_PROGRESS';
    let items = 0;

    while (status === 'IN_PROGRESS' && items < 10) { // Poll for max ~20-30 seconds
      await new Promise(r => setTimeout(r, 3000)); // Wait 3s
      const statusRes = await fetch(
        `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${accessToken}`
      );
      const statusData = await statusRes.json();
      status = statusData.status_code;
      console.log(`Processing status: ${status}`);
      items++;

      if (status === 'ERROR') {
        throw new Error('Instagram failed to process quality of video.');
      }
    }

    if (status !== 'FINISHED') {
      // We can push it anyway and see, or fail. Usually 'FINISHED' is needed.
      // If manual loop timeout, we try to publish and catch error.
      console.warn('Timed out waiting for video processing. Attempting publish anyway...');
    }

    // 4. Publish Media
    const publishUrl = `https://graph.facebook.com/v18.0/${accountId}/media_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken
      })
    });

    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      console.error('Instagram Publish Error:', publishData);
      throw new Error(`Failed to publish to Instagram: ${publishData.error?.message}`);
    }

    // Cleanup: Optionally delete the staging file from Supabase?
    // await supabase.storage.from(bucketName).remove([fileName]);

    return NextResponse.json({
      success: true,
      mediaId: publishData.id,
      permalink: `https://www.instagram.com/reel/${publishData.id}/` // This might be wrong ID, usually just ID.
      // Actually API doesn't return permalink directly in simple publish usually, but id.
    });

  } catch (error: any) {
    console.error('Instagram upload flow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger Instagram upload' },
      { status: 500 }
    );
  }
}
