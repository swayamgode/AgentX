import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const topicsPath = path.join(process.cwd(), 'topics.txt');

        if (!fs.existsSync(topicsPath)) {
            return NextResponse.json({ topics: [] });
        }

        const fileContent = fs.readFileSync(topicsPath, 'utf-8');

        // Parse topics: split by newlines, filter out empty lines and headers/instructions
        const topics = fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => {
                if (!line) return false;
                if (line.length < 5) return false;
                if (line.startsWith('(')) return false;
                return true;
            });

        return NextResponse.json({ topics });
    } catch (error) {
        console.error('Failed to read topics:', error);
        return NextResponse.json({ error: 'Failed to read topics' }, { status: 500 });
    }
}
