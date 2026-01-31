'use client';

import { useState, useEffect, useMemo } from 'react';
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    TrendingUp, TrendingDown, Clock, Calendar, Award,
    AlertCircle, Loader2, BarChart3, Eye
} from 'lucide-react';

interface VideoAnalytics {
    youtubeId: string;
    title: string;
    topic: string;
    templateId: string;
    texts: string[];
    thumbnailUrl?: string;
    uploadedAt: string;
    stats?: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
        lastUpdated: string;
    };
}

const COLORS = {
    primary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
};

export default function DetailedAnalyticsPage() {
    const [videos, setVideos] = useState<VideoAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/youtube/analytics');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch analytics');
            }

            if (data.videos) {
                setVideos(data.videos);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Hourly Performance Analysis
    const hourlyData = useMemo(() => {
        const hourMap: { [key: number]: { views: number, count: number, likes: number } } = {};

        videos.forEach(v => {
            const date = new Date(v.uploadedAt);
            const hour = date.getHours();
            const views = parseInt(v.stats?.viewCount || '0');
            const likes = parseInt(v.stats?.likeCount || '0');

            if (!hourMap[hour]) {
                hourMap[hour] = { views: 0, count: 0, likes: 0 };
            }

            hourMap[hour].views += views;
            hourMap[hour].count += 1;
            hourMap[hour].likes += likes;
        });

        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            hourLabel: `${i.toString().padStart(2, '0')}:00`,
            avgViews: hourMap[i] ? Math.round(hourMap[i].views / hourMap[i].count) : 0,
            totalViews: hourMap[i]?.views || 0,
            videoCount: hourMap[i]?.count || 0,
            avgLikes: hourMap[i] ? Math.round(hourMap[i].likes / hourMap[i].count) : 0,
        })).filter(d => d.videoCount > 0);
    }, [videos]);

    // Daily Performance Analysis
    const dailyData = useMemo(() => {
        const dayMap: { [key: string]: { views: number, count: number, likes: number } } = {};

        videos.forEach(v => {
            const date = new Date(v.uploadedAt);
            const dayKey = date.toISOString().split('T')[0];
            const views = parseInt(v.stats?.viewCount || '0');
            const likes = parseInt(v.stats?.likeCount || '0');

            if (!dayMap[dayKey]) {
                dayMap[dayKey] = { views: 0, count: 0, likes: 0 };
            }

            dayMap[dayKey].views += views;
            dayMap[dayKey].count += 1;
            dayMap[dayKey].likes += likes;
        });

        return Object.entries(dayMap)
            .map(([date, stats]) => ({
                date,
                dateLabel: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views: stats.views,
                avgViews: Math.round(stats.views / stats.count),
                videoCount: stats.count,
                likes: stats.likes,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-14); // Last 14 days
    }, [videos]);

    // Day of Week Performance
    const dayOfWeekData = useMemo(() => {
        const dayMap: { [key: number]: { views: number, count: number } } = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        videos.forEach(v => {
            const date = new Date(v.uploadedAt);
            const dayOfWeek = date.getDay();
            const views = parseInt(v.stats?.viewCount || '0');

            if (!dayMap[dayOfWeek]) {
                dayMap[dayOfWeek] = { views: 0, count: 0 };
            }

            dayMap[dayOfWeek].views += views;
            dayMap[dayOfWeek].count += 1;
        });

        return dayNames.map((name, i) => ({
            day: name,
            avgViews: dayMap[i] ? Math.round(dayMap[i].views / dayMap[i].count) : 0,
            totalViews: dayMap[i]?.views || 0,
            videoCount: dayMap[i]?.count || 0,
        })).filter(d => d.videoCount > 0);
    }, [videos]);

    // Topic Performance
    const topicPerformance = useMemo(() => {
        const topicMap: { [key: string]: { views: number, count: number, likes: number } } = {};

        videos.forEach(v => {
            const topic = v.topic || 'Other';
            const views = parseInt(v.stats?.viewCount || '0');
            const likes = parseInt(v.stats?.likeCount || '0');

            if (!topicMap[topic]) {
                topicMap[topic] = { views: 0, count: 0, likes: 0 };
            }

            topicMap[topic].views += views;
            topicMap[topic].count += 1;
            topicMap[topic].likes += likes;
        });

        return Object.entries(topicMap)
            .map(([topic, stats]) => ({
                topic,
                avgViews: Math.round(stats.views / stats.count),
                totalViews: stats.views,
                videoCount: stats.count,
                avgLikes: Math.round(stats.likes / stats.count),
                engagementRate: stats.views > 0 ? ((stats.likes / stats.views) * 100).toFixed(2) : '0',
            }))
            .sort((a, b) => b.avgViews - a.avgViews);
    }, [videos]);

    // Best and Worst Performers
    const performance = useMemo(() => {
        const sorted = [...videos].sort((a, b) =>
            parseInt(b.stats?.viewCount || '0') - parseInt(a.stats?.viewCount || '0')
        );

        return {
            best: sorted.slice(0, 5),
            worst: sorted.slice(-5).reverse(),
        };
    }, [videos]);

    // Optimal Times
    const optimalTimes = useMemo(() => {
        const bestHour = hourlyData.reduce((max, curr) =>
            curr.avgViews > max.avgViews ? curr : max
            , { hour: 18, avgViews: 0, hourLabel: '18:00' });

        const bestDay = dayOfWeekData.reduce((max, curr) =>
            curr.avgViews > max.avgViews ? curr : max
            , { day: 'Monday', avgViews: 0 });

        return { bestHour, bestDay };
    }, [hourlyData, dayOfWeekData]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#F5F5F7]">
                <LeftSidebar />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                </main>
                <MobileNav />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F5F5F7]">
            <LeftSidebar />

            <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-8">
                {/* Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-[#e5e5e7]">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">
                                    Detailed Analytics
                                </h1>
                                <p className="text-xs md:text-sm text-[#86868b] mt-0.5">
                                    Deep insights into what works and what doesn't
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Optimal Times Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <Clock className="w-6 h-6" />
                                <h3 className="text-lg font-bold">Best Hour to Post</h3>
                            </div>
                            <div className="text-4xl font-bold mb-2">{optimalTimes.bestHour.hourLabel}</div>
                            <p className="text-purple-100">
                                Avg {formatNumber(optimalTimes.bestHour.avgViews)} views per video
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <Calendar className="w-6 h-6" />
                                <h3 className="text-lg font-bold">Best Day to Post</h3>
                            </div>
                            <div className="text-4xl font-bold mb-2">{optimalTimes.bestDay.day}</div>
                            <p className="text-pink-100">
                                Avg {formatNumber(optimalTimes.bestDay.avgViews)} views per video
                            </p>
                        </div>
                    </div>

                    {/* Hourly Performance */}
                    <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-600" />
                            Performance by Hour
                        </h2>
                        <p className="text-sm text-[#86868b] mb-6">
                            Average views based on upload time
                        </p>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
                                    <XAxis
                                        dataKey="hourLabel"
                                        stroke="#86868b"
                                        tick={{ fill: '#86868b', fontSize: 12 }}
                                    />
                                    <YAxis
                                        stroke="#86868b"
                                        tick={{ fill: '#86868b', fontSize: 12 }}
                                        tickFormatter={formatNumber}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderColor: '#e5e5e7',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    />
                                    <Bar dataKey="avgViews" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Daily Trend */}
                    <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-blue-600" />
                            Daily Performance Trend
                        </h2>
                        <p className="text-sm text-[#86868b] mb-6">
                            Last 14 days of activity
                        </p>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.info} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={COLORS.info} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
                                    <XAxis
                                        dataKey="dateLabel"
                                        stroke="#86868b"
                                        tick={{ fill: '#86868b', fontSize: 12 }}
                                    />
                                    <YAxis
                                        stroke="#86868b"
                                        tick={{ fill: '#86868b', fontSize: 12 }}
                                        tickFormatter={formatNumber}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderColor: '#e5e5e7',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(value: any) => formatNumber(value)}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke={COLORS.info}
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorViews)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Day of Week Performance */}
                    <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-pink-600" />
                            Performance by Day of Week
                        </h2>
                        <p className="text-sm text-[#86868b] mb-6">
                            Which days perform best?
                        </p>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dayOfWeekData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
                                    <XAxis
                                        type="number"
                                        stroke="#86868b"
                                        tick={{ fill: '#86868b', fontSize: 12 }}
                                        tickFormatter={formatNumber}
                                    />
                                    <YAxis
                                        dataKey="day"
                                        type="category"
                                        width={100}
                                        stroke="#86868b"
                                        tick={{ fill: '#86868b', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            borderColor: '#e5e5e7',
                                            borderRadius: '12px',
                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                        formatter={(value: any) => formatNumber(value)}
                                    />
                                    <Bar dataKey="avgViews" fill="#ec4899" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Combined Day & Hour View Counts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily View Counts */}
                        <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Daily View Counts
                            </h2>
                            <p className="text-sm text-[#86868b] mb-6">
                                Total views per day (last 14 days)
                            </p>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dailyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
                                        <XAxis
                                            dataKey="dateLabel"
                                            stroke="#86868b"
                                            tick={{ fill: '#86868b', fontSize: 12 }}
                                        />
                                        <YAxis
                                            stroke="#86868b"
                                            tick={{ fill: '#86868b', fontSize: 12 }}
                                            tickFormatter={formatNumber}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                borderColor: '#e5e5e7',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="views"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Hourly View Counts */}
                        <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-600" />
                                Hourly View Counts
                            </h2>
                            <p className="text-sm text-[#86868b] mb-6">
                                Total views by hour of upload
                            </p>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={hourlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" />
                                        <XAxis
                                            dataKey="hourLabel"
                                            stroke="#86868b"
                                            tick={{ fill: '#86868b', fontSize: 12 }}
                                        />
                                        <YAxis
                                            stroke="#86868b"
                                            tick={{ fill: '#86868b', fontSize: 12 }}
                                            tickFormatter={formatNumber}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                borderColor: '#e5e5e7',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="totalViews"
                                            stroke="#f59e0b"
                                            strokeWidth={3}
                                            dot={{ fill: '#f59e0b', r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Topic Performance */}
                    <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-600" />
                            Topic Performance
                        </h2>
                        <p className="text-sm text-[#86868b] mb-6">
                            What topics work best?
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-[#f5f5f7] text-[#86868b] font-medium">
                                    <tr>
                                        <th className="px-4 py-3 text-left rounded-tl-lg">Topic</th>
                                        <th className="px-4 py-3 text-right">Videos</th>
                                        <th className="px-4 py-3 text-right">Avg Views</th>
                                        <th className="px-4 py-3 text-right">Total Views</th>
                                        <th className="px-4 py-3 text-right">Engagement</th>
                                        <th className="px-4 py-3 text-right rounded-tr-lg">Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e5e7]">
                                    {topicPerformance.map((topic, i) => (
                                        <tr key={topic.topic} className="hover:bg-[#fafafa]">
                                            <td className="px-4 py-3 font-semibold text-[#1d1d1f]">
                                                {topic.topic}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[#86868b]">
                                                {topic.videoCount}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-[#1d1d1f]">
                                                {formatNumber(topic.avgViews)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[#86868b]">
                                                {formatNumber(topic.totalViews)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[#86868b]">
                                                {topic.engagementRate}%
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {i < 3 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold">
                                                        <TrendingUp className="w-3 h-3" />
                                                        Top
                                                    </span>
                                                ) : i >= topicPerformance.length - 2 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-full text-xs font-bold">
                                                        <TrendingDown className="w-3 h-3" />
                                                        Low
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs font-bold">
                                                        Average
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Best vs Worst */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Best Performers */}
                        <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                Top Performers
                            </h2>
                            <p className="text-sm text-[#86868b] mb-4">
                                Your best videos
                            </p>
                            <div className="space-y-3">
                                {performance.best.map((video, i) => (
                                    <div key={video.youtubeId} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-[#1d1d1f] truncate">
                                                {video.title}
                                            </div>
                                            <div className="text-xs text-[#86868b]">
                                                {video.topic}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-green-700">
                                                {formatNumber(parseInt(video.stats?.viewCount || '0'))}
                                            </div>
                                            <div className="text-xs text-[#86868b]">views</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Worst Performers */}
                        <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-600" />
                                Needs Improvement
                            </h2>
                            <p className="text-sm text-[#86868b] mb-4">
                                Learn from these
                            </p>
                            <div className="space-y-3">
                                {performance.worst.map((video, i) => (
                                    <div key={video.youtubeId} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-[#1d1d1f] truncate">
                                                {video.title}
                                            </div>
                                            <div className="text-xs text-[#86868b]">
                                                {video.topic}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-red-700">
                                                {formatNumber(parseInt(video.stats?.viewCount || '0'))}
                                            </div>
                                            <div className="text-xs text-[#86868b]">views</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Insights */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-purple-900 mb-3">
                            💡 Key Insights
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
                            <div className="flex items-start gap-2">
                                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong>Best Time:</strong> Post at {optimalTimes.bestHour.hourLabel} for maximum views
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong>Best Day:</strong> {optimalTimes.bestDay.day}s get the most engagement
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Award className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong>Top Topic:</strong> {topicPerformance[0]?.topic} performs best
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <TrendingDown className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <strong>Avoid:</strong> {topicPerformance[topicPerformance.length - 1]?.topic} needs work
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <MobileNav />
        </div>
    );
}
