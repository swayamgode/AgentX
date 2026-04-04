import { NextResponse } from 'next/server';
import { listGeneratedVideos } from '@/lib/video-storage';

export async function GET() {
    try {
        const allVideos = listGeneratedVideos();

        const scheduled = allVideos.filter(v => v.status === 'SCHEDULED');
        const pending = allVideos.filter(v => v.status === 'PENDING_GENERATION');
        const generating = allVideos.filter(v => v.status === 'GENERATING');
        const uploaded = allVideos.filter(v => v.status === 'UPLOADED');
        const failed = allVideos.filter(v => v.status === 'FAILED');

        // Sort scheduled by scheduledFor date ascending (next up first)
        const sortedScheduled = [...scheduled, ...pending, ...generating].sort((a, b) => {
            return new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
        });

        // Find next scheduled video
        const now = new Date();
        const upcoming = sortedScheduled.filter(v => new Date(v.scheduledFor) > now);
        const overdue = sortedScheduled.filter(v => new Date(v.scheduledFor) <= now);

        return NextResponse.json({
            success: true,
            counts: {
                scheduled: scheduled.length,
                pendingGeneration: pending.length,
                generating: generating.length,
                uploaded: uploaded.length,
                failed: failed.length,
                totalRemaining: scheduled.length + pending.length + generating.length,
                totalAll: allVideos.length,
            },
            upcoming: upcoming.slice(0, 10).map(v => ({
                filename: v.filename,
                title: v.title,
                scheduledFor: v.scheduledFor,
                status: v.status,
                accountId: v.accountId,
                templateId: v.templateId,
            })),
            overdue: overdue.map(v => ({
                filename: v.filename,
                title: v.title,
                scheduledFor: v.scheduledFor,
                status: v.status,
                accountId: v.accountId,
            })),
            nextUpload: upcoming.length > 0 ? {
                title: upcoming[0].title,
                scheduledFor: upcoming[0].scheduledFor,
                status: upcoming[0].status,
            } : null,
        });
    } catch (error: any) {
        console.error('Scheduled videos fetch error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch scheduled videos' },
            { status: 500 }
        );
    }
}
