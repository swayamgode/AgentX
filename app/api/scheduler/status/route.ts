
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const statusPath = path.join(process.cwd(), 'scheduler-status.json');

        if (!fs.existsSync(statusPath)) {
            return NextResponse.json({
                status: 'STOPPED',
                message: 'No status file found'
            });
        }

        const content = fs.readFileSync(statusPath, 'utf-8');
        const status = JSON.parse(content);

        // Check if heartbeat is old (older than 2 minutes)
        const lastHeartbeat = new Date(status.lastHeartbeat).getTime();
        const now = new Date().getTime();
        const diffMinutes = (now - lastHeartbeat) / 1000 / 60;

        if (diffMinutes > 2) {
            return NextResponse.json({
                ...status,
                status: 'STALLED',
                message: `Last activity seen ${Math.floor(diffMinutes)} minutes ago`
            });
        }

        return NextResponse.json(status);
    } catch (error) {
        return NextResponse.json({ status: 'ERROR', error: 'Failed to read status' }, { status: 500 });
    }
}
