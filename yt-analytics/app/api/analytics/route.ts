import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getTokens } from "../youtube/callback/route";

export async function GET(req: NextRequest) {
    const tokens = getTokens();
    if (tokens.length === 0) {
        return NextResponse.json({ needsAuth: true, data: null });
    }

    let totalViews = 0;
    let totalSubscribers = 0;
    let channelCount = 0;

    try {
        const params = req.nextUrl.searchParams;

        // Helper: format a Date as YYYY-MM-DD
        const fmt = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // YouTube Analytics has a ~48-72 h processing lag.
        // Cap the effective endDate at (today - 2 days) so we never request unprocessed data.
        const today       = new Date();
        const maxEnd      = new Date(today); maxEnd.setDate(today.getDate() - 2);
        const maxEndStr   = fmt(maxEnd);

        const year         = today.getFullYear();
        const defaultStart = `${year}-04-01`;

        const startDateStr = params.get('startDate') || defaultStart;
        // Use the requested endDate only if it is before the processing cutoff
        const requestedEnd = params.get('endDate') || fmt(today);
        const endDateStr   = requestedEnd < maxEndStr ? requestedEnd : maxEndStr;

        const aggregatedDaily: Record<string, number> = {};
        const channelsData: any[] = [];
        const recentVideos: any[] = [];

        // Iterate over all connected accounts
        for (const token of tokens) {
            const oauth2Client = new google.auth.OAuth2(
                process.env.YOUTUBE_CLIENT_ID,
                process.env.YOUTUBE_CLIENT_SECRET
            );
            oauth2Client.setCredentials(token);

            const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
            const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth: oauth2Client });

            try {
                // 1) Lifetime stats (Data API)
                const channelRes = await youtube.channels.list({
                    mine: true,
                    part: ['snippet', 'statistics']
                });

                if (channelRes.data.items && channelRes.data.items.length > 0) {
                    const ch = channelRes.data.items[0];
                    const stats = ch.statistics;
                    const title = ch.snippet?.title || "Unknown Channel";
                    
                    const chViews = parseInt(stats?.viewCount || "0");
                    const chSubs = parseInt(stats?.subscriberCount || "0");
                    
                    totalViews += chViews;
                    totalSubscribers += chSubs;
                    channelCount++;

                    const chDailyViews: Record<string, number> = {};

                    // 2) Daily Views for the requested date range (Analytics API)
                    const analyticsRes = await youtubeAnalytics.reports.query({
                        ids: `channel==MINE`,
                        startDate: startDateStr,
                        endDate: endDateStr,
                        metrics: 'views',
                        dimensions: 'day',
                        sort: 'day'
                    });

                    const rows = analyticsRes.data.rows || [];
                    rows.forEach((row: any) => {
                        const dateStr = row[0];
                        const views = row[1] || 0;
                        if (!aggregatedDaily[dateStr]) {
                            aggregatedDaily[dateStr] = 0;
                        }
                        aggregatedDaily[dateStr] += views;
                        chDailyViews[dateStr] = views;
                    });

                    channelsData.push({
                        id: ch.id,
                        title,
                        views: chViews,
                        subscribers: chSubs,
                        dailyViews: chDailyViews,
                        tokenIndex: tokens.indexOf(token)
                    });

                    // 3) Recent Videos for the feed
                    const searchRes = await youtube.search.list({
                        channelId: ch.id as string,
                        part: ['snippet'],
                        order: 'date',
                        maxResults: 5,
                        type: ['video']
                    });

                    if (searchRes.data.items) {
                        const videoIds = searchRes.data.items
                            .map(v => v.id?.videoId)
                            .filter((id): id is string => typeof id === 'string' && id.length > 0);
                        if (videoIds.length > 0) {
                            const videosRes = await youtube.videos.list({
                                id: videoIds,
                                part: ['snippet', 'statistics']
                            });

                            videosRes.data.items?.forEach(v => {
                                if (v.id) {
                                    recentVideos.push({
                                        id: v.id,
                                        title: v.snippet?.title || "Untitled",
                                        thumbnail: v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.default?.url,
                                        views: parseInt(v.statistics?.viewCount || "0"),
                                        publishedAt: v.snippet?.publishedAt || new Date().toISOString(),
                                        channelTitle: title
                                    });
                                }
                            });
                        }
                    }
                }

            } catch (err) {
                console.error("Error fetching one specific account, skipping...", err);
            }
        }

        // Format aggregated time series
        const sortedDates = Object.keys(aggregatedDaily).sort();
        const timeSeriesData = sortedDates.map(dateStr => {
            const [year, month, day] = dateStr.split('-');
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const formattedName = `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]}`;

            const datum: any = {
                name: formattedName, 
                fullDate: dateStr,
                global_views: aggregatedDaily[dateStr]
            };
            
            // Add individual channel views
            channelsData.forEach(ch => {
                datum[ch.title] = ch.dailyViews[dateStr] || 0;
            });

            return datum;
        });

        const formatNumber = (num: number) => {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        };

        const resultData = {
            accountsConnected: channelCount,
            dataRange: {
                start: startDateStr,
                end: endDateStr,         // actual last date YouTube had data for
                lagNote: 'YouTube Analytics data has a 48–72 h processing delay.'
            },
            channels: channelsData
                .sort((a, b) => a.title.localeCompare(b.title))
                .map(c => ({
                    id: c.id,
                    title: c.title,
                    views: formatNumber(c.views),
                    subscribers: formatNumber(c.subscribers),
                    tokenIndex: c.tokenIndex
                })),
            timeSeriesData: timeSeriesData.length > 0 ? timeSeriesData : null,
            recentVideos: recentVideos
                .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                .slice(0, 10)
                .map(v => ({
                    ...v,
                    views: v.views >= 1000 ? (v.views / 1000).toFixed(1) + 'K' : v.views.toString()
                })),
            totals: {
                views: formatNumber(totalViews),
                subscribers: formatNumber(totalSubscribers),
                watchTime: "N/A",
                engagement: "N/A"
            }
        };

        return NextResponse.json({ needsAuth: false, data: resultData });

    } catch (error: any) {
        console.error("YouTube Data API Error:", error);
        return NextResponse.json({ needsAuth: false, data: null, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const indexStr = searchParams.get('index');
    if (!indexStr) return NextResponse.json({ success: false });
    
    const index = parseInt(indexStr, 10);
    const tokens = getTokens();
    if (index >= 0 && index < tokens.length) {
        tokens.splice(index, 1);
        const fs = require('fs');
        const path = require('path');
        fs.writeFileSync(path.join(process.cwd(), 'data', 'tokens.json'), JSON.stringify(tokens, null, 2));
    }
    return NextResponse.json({ success: true });
}
