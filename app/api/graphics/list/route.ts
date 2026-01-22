import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const graphicsDir = path.join(process.cwd(), 'public', 'graphics');

        // Check if directory exists
        if (!fs.existsSync(graphicsDir)) {
            return NextResponse.json({ graphics: [] });
        }

        const files = fs.readdirSync(graphicsDir);

        // Filter for image files
        const graphics = files.filter(file =>
            /\.(png|jpe?g|svg|webp)$/i.test(file)
        ).map(file => `/graphics/${file}`);

        return NextResponse.json({ graphics });
    } catch (error) {
        console.error('Error listing graphics:', error);
        return NextResponse.json({ error: 'Failed to list graphics' }, { status: 500 });
    }
}
