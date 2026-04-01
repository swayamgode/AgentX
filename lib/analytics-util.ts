
import { analyticsStorage, VideoAnalyticsData } from './analytics-storage';

// Extension to AnalyticsStorage to support finding optimal times
export function getOptimalUploadHour(accountId: string, userId: string = 'dev-id-001'): number {
    const allData = analyticsStorage.getAll(userId);

    // Filter stats for this account (if we could map them, but analytics currently doesn't map to accountId strictly without checking token storage)
    // For now, we will use GLOBAL heuristics because mapping youtubeId -> accountId requires more lookups.
    // However, if we assume the user uploads consistenly, the analytics file contains all our videos.

    // Group by hour
    const hourStats: { [key: number]: { count: number, totalViews: number } } = {};

    for (const video of allData) {
        if (!video.uploadedAt || !video.stats) continue;

        const date = new Date(video.uploadedAt);
        const hour = date.getHours();
        const views = parseInt(video.stats.viewCount || '0');

        if (!hourStats[hour]) {
            hourStats[hour] = { count: 0, totalViews: 0 };
        }

        hourStats[hour].count++;
        hourStats[hour].totalViews += views;
    }

    let bestHour = 18; // Default to 6 PM
    let maxAvgViews = -1;

    for (const hourStr in hourStats) {
        const hour = parseInt(hourStr);
        const stats = hourStats[hour];
        const avg = stats.totalViews / stats.count;

        if (avg > maxAvgViews) {
            maxAvgViews = avg;
            bestHour = hour;
        }
    }

    // If no significant data (e.g. max average is 0), stick to default
    if (maxAvgViews <= 0) return 18;

    return bestHour;
}
