import { NextRequest, NextResponse } from 'next/server';
import { createMemeConfig } from '@/lib/ai-meme-generator';
import { saveVideoLocally } from '@/lib/video-storage';
import { VIDEO_TEMPLATES } from '@/lib/video-templates';
import { AUDIO_LIBRARY } from '@/lib/audio-library';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { memes, schedule } = body;

        if (!Array.isArray(memes) || memes.length === 0) {
            return NextResponse.json(
                { error: 'Memes array is required' },
                { status: 400 }
            );
        }

        if (!Array.isArray(schedule) || schedule.length !== memes.length) {
            return NextResponse.json(
                { error: 'Schedule must match memes count' },
                { status: 400 }
            );
        }

        const results = [];

        for (let i = 0; i < memes.length; i++) {
            const meme = memes[i];
            const scheduledFor = new Date(schedule[i]);

            try {
                // Get template and audio
                const template = VIDEO_TEMPLATES.find(t => t.id === meme.templateId);
                const audio = meme.audioId ? AUDIO_LIBRARY.find(a => a.id === meme.audioId) : null;

                if (!template) {
                    throw new Error(`Template ${meme.templateId} not found`);
                }

                // Create video configuration
                const config = createMemeConfig(meme);

                // For now, we'll store the configuration and generate videos on-demand
                // In a production system, you'd generate the video here using server-side rendering

                // Store metadata for scheduled post
                const metadata = {
                    scheduledFor,
                    title: meme.title,
                    description: meme.description,
                    tags: meme.tags,
                    templateId: meme.templateId,
                    audioId: meme.audioId,
                    textOverlays: meme.textOverlays,
                    status: 'pending',
                };

                results.push({
                    index: i,
                    success: true,
                    metadata,
                });

            } catch (error: any) {
                results.push({
                    index: i,
                    success: false,
                    error: error.message,
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        return NextResponse.json({
            success: true,
            total: memes.length,
            successful: successCount,
            failed: memes.length - successCount,
            results,
        });

    } catch (error: any) {
        console.error('Batch creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create batch videos' },
            { status: 500 }
        );
    }
}
