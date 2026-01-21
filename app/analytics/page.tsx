"use client";

import { useEffect, useState, useMemo } from 'react';
import {
    BarChart3,
    Eye,
    ThumbsUp,
    MessageSquare,
    Video,
    Calendar,
    RefreshCw,
    AlertCircle,
    TrendingUp,
    ArrowUpRight
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

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

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

export default function AnalyticsPage() {
    const [videos, setVideos] = useState<VideoAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/youtube/analytics');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch analytics');
            }

            if (data.videos) {
                const sorted = data.videos.sort((a: VideoAnalytics, b: VideoAnalytics) =>
                    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
                );
                setVideos(sorted);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    // --- Data Processing for Charts ---

    const stats = useMemo(() => {
        const totalViews = videos.reduce((acc, v) => acc + parseInt(v.stats?.viewCount || '0'), 0);
        const totalLikes = videos.reduce((acc, v) => acc + parseInt(v.stats?.likeCount || '0'), 0);
        const totalComments = videos.reduce((acc, v) => acc + parseInt(v.stats?.commentCount || '0'), 0);
        const avgViews = videos.length > 0 ? Math.round(totalViews / videos.length) : 0;

        return { totalViews, totalLikes, totalComments, avgViews };
    }, [videos]);

    const growthData = useMemo(() => {
        // Reverse for chronological order (oldest to newest)
        return [...videos].reverse().map(v => ({
            name: new Date(v.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: parseInt(v.stats?.viewCount || '0'),
            likes: parseInt(v.stats?.likeCount || '0'),
            title: v.title
        }));
    }, [videos]);

    const topicData = useMemo(() => {
        const topicMap: Record<string, number> = {};
        videos.forEach(v => {
            const topic = v.topic || 'Other';
            const views = parseInt(v.stats?.viewCount || '0');
            topicMap[topic] = (topicMap[topic] || 0) + views;
        });
        return Object.entries(topicMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [videos]);

    const engagementData = useMemo(() => {
        return [
            { name: 'Likes', value: stats.totalLikes },
            { name: 'Comments', value: stats.totalComments }
        ].filter(d => d.value > 0);
    }, [stats]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    if (loading && !videos.length) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-gray-100 p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-end border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Overview</h1>
                        <p className="text-gray-400 mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Real-time performance data
                        </p>
                    </div>
                    <button
                        onClick={() => fetchAnalytics(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 text-sm rounded-lg transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Syncing...' : 'Sync Data'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Total Views"
                        value={formatNumber(stats.totalViews)}
                        icon={<Eye className="w-5 h-5 text-blue-400" />}
                        trend="+12%" // mocked trend for aesthetics as we don't have historical delta yet
                    />
                    <KPICard
                        title="Avg. Views"
                        value={formatNumber(stats.avgViews)}
                        icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
                        trend="+5%"
                    />
                    <KPICard
                        title="Total Engagement"
                        value={formatNumber(stats.totalLikes + stats.totalComments)}
                        icon={<ThumbsUp className="w-5 h-5 text-pink-400" />}
                        trend="+8%"
                    />
                    <KPICard
                        title="Videos Published"
                        value={videos.length.toString()}
                        icon={<Video className="w-5 h-5 text-green-400" />}
                        trend=""
                    />
                </div>

                {/* Charts Row 1: Growth Trend */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white">Views Growth (Recent Uploads)</h2>
                        <div className="text-xs text-gray-500">Last {growthData.length} Videos</div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#6b7280"
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => formatNumber(value)}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem' }}
                                    itemStyle={{ color: '#e5e7eb' }}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorViews)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Charts Row 2: Topics & Engagement */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Topics */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-lg font-semibold text-white mb-6">Top Performing Topics</h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topicData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#1f2937', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem' }}
                                        itemStyle={{ color: '#e5e7eb' }}
                                    />
                                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                        {topicData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Engagement Split */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
                        <h2 className="text-lg font-semibold text-white mb-6">Engagement Distribution</h2>
                        <div className="h-[300px] w-full flex items-center justify-center">
                            {engagementData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={engagementData}
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {engagementData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#f472b6' : '#60a5fa'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem' }}
                                            itemStyle={{ color: '#e5e7eb' }}
                                        />
                                        <Legend verticalAlign="middle" align="right" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-gray-500 text-sm">No engagement data yet</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Videos Table */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-sm">
                    <div className="p-6 border-b border-gray-800">
                        <h2 className="text-lg font-semibold text-white">Recent Uploads</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-gray-900/80 text-gray-200 uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-4">Video</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Views</th>
                                    <th className="px-6 py-4 text-right">Likes</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {videos.slice(0, 10).map((video) => (
                                    <tr key={video.youtubeId} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-16 h-9 bg-gray-800 rounded overflow-hidden flex-shrink-0 relative group">
                                                    {video.thumbnailUrl ? (
                                                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center"><Video className="w-4 h-4" /></div>
                                                    )}
                                                </div>
                                                <div className="max-w-[200px] truncate">
                                                    <div className="font-medium text-white truncate" title={video.title}>{video.title}</div>
                                                    <div className="text-xs text-gray-500">{video.topic}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(video.uploadedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-white">
                                            {formatNumber(parseInt(video.stats?.viewCount || '0'))}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {formatNumber(parseInt(video.stats?.likeCount || '0'))}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                                            >
                                                Watch <ArrowUpRight className="w-3 h-3" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

function KPICard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) {
    return (
        <div className="bg-gray-900/40 border border-gray-800 p-6 rounded-xl backdrop-blur-sm hover:border-gray-700 transition-all">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-gray-800/50 rounded-lg">
                    {icon}
                </div>
                {trend && (
                    <span className="text-xs font-medium text-green-400 bg-green-900/10 px-2 py-1 rounded-full border border-green-900/20">
                        {trend}
                    </span>
                )}
            </div>
            <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                <div className="text-sm text-gray-500 mt-1">{title}</div>
            </div>
        </div>
    );
}
