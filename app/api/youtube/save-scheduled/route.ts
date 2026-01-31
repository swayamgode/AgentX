import { NextRequest, NextResponse } from 'next/server';
import { saveVideoLocally } from '@/lib/video-storage';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const videoBlob = formData.get('videoBlob') as Blob;
        const metadataStr = formData.get('metadata') as string;

        if (!videoBlob || !metadataStr) {
            return NextResponse.json(
                { error: 'Missing video or metadata' },
                { status: 400 }
            );
        }

        const metadata = JSON.parse(metadataStr);

        // Save video locally with metadata
        const savedVideo = await saveVideoLocally(videoBlob, {
            scheduledFor: new Date(metadata.scheduledFor),
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            templateId: metadata.templateId,
            audioId: metadata.audioId,
            accountId: metadata.accountId,
            status: 'SCHEDULED' // Will be picked up by scheduler
        });

        return NextResponse.json({
            success: true,
            filename: savedVideo.filename,
            path: savedVideo.path,
            scheduledFor: savedVideo.scheduledFor
        });

    } catch (error: any) {
        console.error('Save scheduled video error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to save video' },
            { status: 500 }
        );
    }
}
