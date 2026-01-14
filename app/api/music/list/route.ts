import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
    try {
        const metadataPath = path.join(process.cwd(), 'public', 'music', 'royalty-free', 'metadata.json');
        const data = await fs.readFile(metadataPath, 'utf-8');
        const library = JSON.parse(data);

        return NextResponse.json(library);
    } catch (error) {
        console.error('Error loading music library:', error);
        return NextResponse.json(
            { error: 'Failed to load music library' },
            { status: 500 }
        );
    }
}
