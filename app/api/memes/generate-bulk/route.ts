import { NextRequest, NextResponse } from 'next/server';
import { generateBulkMemes } from '@/lib/ai-meme-generator';

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Google API key not configured' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { topic, count = 10, includeAudio = true, templatePreference = 'all' } = body;

        if (!topic) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400 }
            );
        }

        if (count < 1 || count > 100) {
            return NextResponse.json(
                { error: 'Count must be between 1 and 100' },
                { status: 400 }
            );
        }

        console.log(`Generating ${count} memes about: ${topic}`);

        const memes = await generateBulkMemes(
            {
                topic,
                count,
                includeAudio,
                templatePreference,
            },
            apiKey
        );

        return NextResponse.json({
            success: true,
            count: memes.length,
            memes,
        });

    } catch (error: any) {
        console.error('Bulk generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate memes' },
            { status: 500 }
        );
    }
}
