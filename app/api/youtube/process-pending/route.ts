import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// This endpoint returns pending videos that need to be generated client-side
// The client will render them using the browser canvas API
export async function GET(request: NextRequest) {
    try {
        const pendingFile = path.join(process.cwd(), 'public', 'pending-batch.json');

        if (!fs.existsSync(pendingFile)) {
            return NextResponse.json({
                pending: [],
                count: 0
            });
        }

        const allPending = JSON.parse(fs.readFileSync(pendingFile, 'utf-8'));

        // Filter for items that need generation (not already generated)
        const needsGeneration = allPending.filter((item: any) =>
            item.status === 'PENDING_GENERATION'
        );

        return NextResponse.json({
            pending: needsGeneration,
            count: needsGeneration.length
        });

    } catch (error: any) {
        console.error('Error reading pending videos:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// Mark a video as generated
export async function POST(request: NextRequest) {
    try {
        const { id, filename, status } = await request.json();

        const pendingFile = path.join(process.cwd(), 'public', 'pending-batch.json');

        if (!fs.existsSync(pendingFile)) {
            return NextResponse.json(
                { error: 'No pending file found' },
                { status: 404 }
            );
        }

        const allPending = JSON.parse(fs.readFileSync(pendingFile, 'utf-8'));

        // Update the item
        const item = allPending.find((p: any) => p.id === id);
        if (item) {
            item.status = status || 'GENERATED';
            item.filename = filename;
            item.generatedAt = new Date().toISOString();
        }

        fs.writeFileSync(pendingFile, JSON.stringify(allPending, null, 2));

        return NextResponse.json({
            success: true,
            message: 'Status updated'
        });

    } catch (error: any) {
        console.error('Error updating pending video:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
