import { NextResponse } from 'next/server';
import { StrategyEngine } from '@/lib/strategy-engine';

export async function POST() {
    try {
        const apiKey = process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'API Configuration Missing' },
                { status: 500 }
            );
        }

        const engine = new StrategyEngine(apiKey);
        const suggestions = await engine.generateSuggestions();

        return NextResponse.json({ suggestions });
    } catch (error: any) {
        console.error('Strategy API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate strategy' },
            { status: 500 }
        );
    }
}
