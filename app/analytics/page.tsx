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
    ArrowUpRight,
    Play,
    Activity,
    Zap
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

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

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
        return [...videos].reverse().map(v => {
            const date = new Date(v.uploadedAt);
            return {
                name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }), // e.g. "Jan 21 14:30"
                shortName: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // for X Axis if we prefer short
                time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                views: parseInt(v.stats?.viewCount || '0'),
                likes: parseInt(v.stats?.likeCount || '0'),
                title: v.title
            };
        });
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
            <div className="min-h-screen bg-[#050505] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    <p className="text-gray-500 animate-pulse">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-8 font-sans selection:bg-purple-500/30">
            {/* Ambient Background Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight">Analytics Code</h1>
                        <p className="text-gray-400 mt-2 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            Live performance tracking
                        </p>
                    </div>
                    <button
                        onClick={() => fetchAnalytics(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 text-sm font-medium rounded-xl transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-purple-500/10 active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Syncing...' : 'Sync Data'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center gap-3 backdrop-blur-md">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        {error}
                    </div>
                )}

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Total Views"
                        value={formatNumber(stats.totalViews)}
                        icon={<Eye className="w-5 h-5 text-white" />}
                        trend="+12%"
                        color="from-blue-500 to-cyan-500"
                    />
                    <KPICard
                        title="Avg. Views / Video"
                        value={formatNumber(stats.avgViews)}
                        icon={<TrendingUp className="w-5 h-5 text-white" />}
                        trend="+5%"
                        color="from-purple-500 to-pink-500"
                    />
                    <KPICard
                        title="Total Interaction"
                        value={formatNumber(stats.totalLikes + stats.totalComments)}
                        icon={<ThumbsUp className="w-5 h-5 text-white" />}
                        trend="+8%"
                        color="from-orange-500 to-red-500"
                    />
                    <KPICard
                        title="Content Library"
                        value={videos.length.toString()}
                        icon={<Video className="w-5 h-5 text-white" />}
                        trend="Videos"
                        color="from-emerald-500 to-green-500"
                    />
                </div>

                {/* Charts Row 1: Growth Trend */}
                <div className="bg-[#0f0f0f]/60 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-400" />
                                Growth Trajectory
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">View count progression over recent uploads</p>
                        </div>
                        <div className="text-xs font-mono text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            Last {growthData.length} Videos
                        </div>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#525252"
                                    tick={{ fill: '#737373', fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={30}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#525252"
                                    tick={{ fill: '#737373', fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                    tickFormatter={(value) => formatNumber(value)}
                                />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelStyle={{ color: '#a3a3a3', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="views"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
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
                    <div className="bg-[#0f0f0f]/60 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Niche Performance
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Top performing content categories</p>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topicData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fill: '#a3a3a3', fontSize: 13, fontWeight: 500 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }}
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                                        {topicData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Engagement Split */}
                    <div className="bg-[#0f0f0f]/60 border border-white/5 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col">
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-pink-400" />
                            Engagement Mix
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">Distribution of user interactions</p>

                        <div className="h-[300px] w-full flex-1 flex items-center justify-center relative">
                            {engagementData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={engagementData}
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {engagementData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === 0 ? '#ec4899' : '#3b82f6'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-gray-500 text-sm flex flex-col items-center gap-2">
                                    <AlertCircle className="w-8 h-8 opacity-50" />
                                    No engagement data yet
                                </div>
                            )}
                            {/* Center Statistic */}
                            {engagementData.length > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold text-white">
                                        {formatNumber(stats.totalLikes + stats.totalComments)}
                                    </span>
                                    <span className="text-xs text-gray-500 uppercase tracking-widest">Total</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Videos Table */}
                <div className="bg-[#0f0f0f]/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Recent Uploads</h2>
                        <button className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider">
                            View All
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-white/5 text-gray-300 font-medium">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-lg">Content</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Views</th>
                                    <th className="px-6 py-4 text-right">Likes</th>
                                    <th className="px-6 py-4 text-right rounded-tr-lg">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {videos.slice(0, 10).map((video) => (
                                    <tr key={video.youtubeId} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-24 h-14 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative group shadow-lg border border-white/5">
                                                    {video.thumbnailUrl ? (
                                                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-900"><Video className="w-6 h-6 text-gray-600" /></div>
                                                    )}
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                        <Play className="w-6 h-6 text-white fill-white" />
                                                    </div>
                                                </div>
                                                <div className="max-w-[250px]">
                                                    <div className="font-semibold text-white truncate" title={video.title}>{video.title}</div>
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400">{video.topic || 'General'}</span>
                                                        <span>•</span>
                                                        <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                Public
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-white font-mono tracking-tight">
                                            {formatNumber(parseInt(video.stats?.viewCount || '0'))}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-gray-300">
                                            {formatNumber(parseInt(video.stats?.likeCount || '0'))}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <a
                                                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-all inline-block"
                                                title="Watch on YouTube"
                                            >
                                                <ArrowUpRight className="w-4 h-4" />
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

function KPICard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend?: string, color: string }) {
    return (
        <div className="relative group overflow-hidden bg-[#0f0f0f]/60 border border-white/5 p-6 rounded-2xl backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-white/10">
            {/* Gradient Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg shadow-purple-500/20`}>
                    {icon}
                </div>
                {trend && (
                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/20 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {trend}
                    </span>
                )}
            </div>
            <div className="relative z-10">
                <div className="text-3xl font-bold text-white tracking-tight font-mono">{value}</div>
                <div className="text-sm text-gray-500 mt-1 font-medium">{title}</div>
            </div>
        </div>
    );
}
