import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Read video analytics
        const analyticsPath = path.join(process.cwd(), '.video-analytics.json');
        let totalVideos = 0;
        let totalViews = 0;

        if (fs.existsSync(analyticsPath)) {
            const fileContent = fs.readFileSync(analyticsPath, 'utf-8');
            const analyticsData = JSON.parse(fileContent);

            // Handle both array format and object format with .videos
            const videos = Array.isArray(analyticsData) ? analyticsData : (analyticsData.videos || []);

            totalVideos = videos.length;
            totalViews = videos.reduce((sum: number, video: any) => {
                return sum + (parseInt(video.stats?.viewCount) || 0);
            }, 0);

            // Calculate weekly activity (last 7 days based on uploadedAt)
            const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
            const today = new Date();
            const last7Days = [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                last7Days.push({
                    day: days[d.getDay()],
                    date: d.toISOString().split('T')[0],
                    count: 0
                });
            }

            videos.forEach((video: any) => {
                if (video.uploadedAt) {
                    const videoDate = video.uploadedAt.split('T')[0];
                    const dayStat = last7Days.find(d => d.date === videoDate);
                    if (dayStat) {
                        dayStat.count += 1;
                    }
                }
            });

            // Read scheduled posts (from tweets pending approval)
            const tweetsPath = path.join(process.cwd(), '.tweets-pending.json');
            let scheduledPosts = 0;

            if (fs.existsSync(tweetsPath)) {
                const tweetsData = JSON.parse(fs.readFileSync(tweetsPath, 'utf-8'));
                scheduledPosts = tweetsData.length || 0;
            }

            // Calculate total posts (Videos + Tweets)
            const totalPosts = totalVideos + scheduledPosts;

            return NextResponse.json({
                success: true,
                stats: {
                    totalPosts,
                    scheduledPosts,
                    totalVideos,
                    totalViews,
                    weeklyActivity: last7Days.map(d => ({ day: d.day, hours: d.count })) // Mapping count to 'hours' for frontend compatibility
                }
            });
        }
    } catch (error) {
        console.error('Error fetching analytics stats:', error);
        return NextResponse.json({
            success: true,
            stats: {
                totalPosts: 0,
                scheduledPosts: 0,
                totalVideos: 0,
                totalViews: 0
            }
        });
    }
}
