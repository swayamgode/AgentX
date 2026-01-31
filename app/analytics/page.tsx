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
    Zap,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={32} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-black text-[#e7e9ea]">
            <LeftSidebar />

            <main className="flex-1 border-x border-[#333] min-h-screen flex flex-col pb-20 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#333]">
                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <BarChart3 className="text-purple-500" /> Analytics Code
                            </h1>
                            <p className="text-sm text-[#71767b] mt-1">
                                <Activity className="w-3 h-3 inline mr-1 text-green-500" />
                                Live performance tracking
                            </p>
                        </div>
                        <button
                            onClick={() => fetchAnalytics(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-400 transition-colors disabled:opacity-50 self-end md:self-auto"
                        >
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                            {refreshing ? 'Syncing...' : 'Sync Data'}
                        </button>
                    </div>
                </div>

                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                    {/* Ambient Background Glow - adjusted z-index to be behind content but inside main */}
                    <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-50">
                        <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-10%] right-[0%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
                    </div>

                    <div className="relative z-10 space-y-6 md:space-y-8">

                        {error && (
                            <div className="bg-red-900/10 border border-red-500/20 text-red-200 p-4 rounded-xl flex items-center justify-between backdrop-blur-md flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                    <span>{error}</span>
                                </div>
                                {error.toLowerCase().includes('expired') || error.toLowerCase().includes('auth') || error.toLowerCase().includes('connect') ? (
                                    <Link
                                        href="/settings"
                                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg text-sm font-bold transition-all w-full md:w-auto text-center"
                                    >
                                        Reconnect YouTube
                                    </Link>
                                ) : null}
                            </div>
                        )}

                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        <div className="bg-black border border-[#333] rounded-2xl p-4 md:p-6 overflow-hidden">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-2">
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-[#e7e9ea] flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-purple-400" />
                                        Growth Trajectory
                                    </h2>
                                    <p className="text-xs md:text-sm text-[#71767b] mt-1">View count progression over recent uploads</p>
                                </div>
                                <div className="text-xs font-mono text-[#71767b] bg-[#16181c] px-3 py-1 rounded-full border border-[#333]">
                                    Last {growthData.length} Videos
                                </div>
                            </div>
                            <div className="h-[250px] md:h-[350px] w-full -ml-4 md:ml-0 pr-4 md:pr-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                        <YAxis
                                            stroke="#525252"
                                            tick={{ fill: '#71767b', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                            tickFormatter={(value) => formatNumber(value)}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: '#333', strokeWidth: 1 }}
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '12px' }}
                                            itemStyle={{ color: '#e7e9ea' }}
                                            labelStyle={{ color: '#71767b', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}
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
                            <div className="bg-black border border-[#333] rounded-2xl p-4 md:p-6">
                                <h2 className="text-lg md:text-xl font-bold text-[#e7e9ea] mb-2 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                    Niche Performance
                                </h2>
                                <p className="text-xs md:text-sm text-[#71767b] mb-6">Top performing content categories</p>

                                <div className="h-[250px] md:h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topicData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={90}
                                                tick={{ fill: '#71767b', fontSize: 12, fontWeight: 500 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#16181c', radius: 4 }}
                                                contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '12px' }}
                                                itemStyle={{ color: '#e7e9ea' }}
                                            />
                                            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} >
                                                {topicData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Engagement Split */}
                            <div className="bg-black border border-[#333] rounded-2xl p-4 md:p-6 flex flex-col">
                                <h2 className="text-lg md:text-xl font-bold text-[#e7e9ea] mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-pink-400" />
                                    Engagement Mix
                                </h2>
                                <p className="text-xs md:text-sm text-[#71767b] mb-6">Distribution of user interactions</p>

                                <div className="h-[250px] md:h-[300px] w-full flex-1 flex items-center justify-center relative">
                                    {engagementData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={engagementData}
                                                    innerRadius={70}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {engagementData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#ec4899' : '#3b82f6'} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#e7e9ea' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-[#71767b] text-sm flex flex-col items-center gap-2">
                                            <AlertCircle className="w-8 h-8 opacity-50" />
                                            No engagement data yet
                                        </div>
                                    )}
                                    {/* Center Statistic */}
                                    {engagementData.length > 0 && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                            <span className="text-2xl md:text-3xl font-bold text-[#e7e9ea]">
                                                {formatNumber(stats.totalLikes + stats.totalComments)}
                                            </span>
                                            <span className="text-xs text-[#71767b] uppercase tracking-widest">Total</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* AI Strategy Engine */}
                        <div className="bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-2xl p-4 md:p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Zap className="w-16 h-16 md:w-24 md:h-24 text-purple-500" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-lg md:text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">AI Strategy Engine</span>
                                    <span className="text-[10px] md:text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">BETA</span>
                                </h2>
                                <p className="text-stone-400 max-w-2xl mb-6 text-sm md:text-base">
                                    This model "trains" on your historical analytics data to identify winning patterns.
                                    It analyzes correlation between topics, keywords, and view velocity to suggest high-probability video ideas.
                                </p>

                                <StrategyGenerator />
                            </div>
                        </div>

                        {/* Recent Videos Table */}
                        <div className="bg-black border border-[#333] rounded-2xl overflow-hidden">
                            <div className="p-4 md:p-6 border-b border-[#333] flex justify-between items-center">
                                <h2 className="text-lg md:text-xl font-bold text-[#e7e9ea]">Recent Uploads</h2>
                                <button className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-wider">
                                    View All
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-[#71767b]">
                                    <thead className="bg-[#16181c] text-[#71767b] font-medium hidden md:table-header-group">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-lg">Content</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Views</th>
                                            <th className="px-6 py-4 text-right">Likes</th>
                                            <th className="px-6 py-4 text-right rounded-tr-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#333]">
                                        {videos.slice(0, 10).map((video) => (
                                            <tr key={video.youtubeId} className="hover:bg-[#16181c] transition-colors group flex md:table-row flex-col">
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="w-20 md:w-24 h-12 md:h-14 bg-[#16181c] rounded-lg overflow-hidden flex-shrink-0 relative group shadow-lg border border-[#333]">
                                                            {video.thumbnailUrl ? (
                                                                <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-[#16181c]"><Video className="w-6 h-6 text-[#71767b]" /></div>
                                                            )}
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                                <Play className="w-6 h-6 text-white fill-white" />
                                                            </div>
                                                        </div>
                                                        <div className="max-w-[200px] md:max-w-[250px]">
                                                            <div className="font-semibold text-[#e7e9ea] truncate text-sm md:text-base" title={video.title}>{video.title}</div>
                                                            <div className="text-xs text-[#71767b] mt-1 flex items-center gap-2">
                                                                <span className="px-1.5 py-0.5 rounded bg-[#16181c] border border-[#333] text-[#71767b]">{video.topic || 'General'}</span>
                                                                <span>•</span>
                                                                <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-2 md:py-4 flex items-center justify-between md:table-cell">
                                                    <span className="md:hidden text-xs font-medium">Status</span>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                        Public
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-6 py-2 md:py-4 text-right font-bold text-[#e7e9ea] font-mono tracking-tight flex items-center justify-between md:table-cell">
                                                    <span className="md:hidden text-xs font-normal text-gray-500">Views</span>
                                                    {formatNumber(parseInt(video.stats?.viewCount || '0'))}
                                                </td>
                                                <td className="px-4 md:px-6 py-2 md:py-4 text-right font-mono text-[#71767b] flex items-center justify-between md:table-cell">
                                                    <span className="md:hidden text-xs font-normal text-gray-500">Likes</span>
                                                    {formatNumber(parseInt(video.stats?.likeCount || '0'))}
                                                </td>
                                                <td className="px-4 md:px-6 py-2 md:py-4 text-right hidden md:table-cell">
                                                    <a
                                                        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#71767b] hover:text-white p-2 hover:bg-[#16181c] rounded-lg transition-all inline-block"
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
            </main>
            <MobileNav />
        </div>
    );
}


// --- Strategy Component ---

interface VideoSuggestion {
    title: string;
    topic: string;
    reasoning: string;
    predictedPerformance: 'High' | 'Medium' | 'Low';
}

function StrategyGenerator() {
    const [suggestions, setSuggestions] = useState<VideoSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [competitorInput, setCompetitorInput] = useState("");

    const generate = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/analytics/strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    competitorHandle: competitorInput.trim() ? competitorInput.trim() : undefined
                })
            });
            const data = await res.json();
            if (data.suggestions) {
                setSuggestions(data.suggestions);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {!suggestions.length && !loading && (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-[#71767b] uppercase tracking-wider mb-2 block">
                            Market Analysis (Optional)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={competitorInput}
                                onChange={(e) => setCompetitorInput(e.target.value)}
                                placeholder="Enter competitor channel (e.g. @MrBeast, @Veritasium)"
                                className="flex-1 bg-black/40 border border-[#333] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 transition-all font-mono text-sm"
                            />
                        </div>
                        <p className="text-xs text-[#555] mt-2">
                            Leave empty to train on your data only. Enter a handle to combine insights.
                        </p>
                    </div>

                    <button
                        onClick={generate}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                    >
                        <Zap className="w-5 h-5 fill-black" />
                        {competitorInput ? 'Analyze Market & Generate Strategy' : 'Train Model & Generate Ideas'}
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-purple-300">
                    <Loader2 className="animate-spin w-8 h-8" />
                    <div className="text-center space-y-1">
                        <span className="font-bold block animate-pulse">Analyzing Pattern Data...</span>
                        <span className="text-sm text-purple-400/60 block">
                            {competitorInput ? `Scraping public trends from ${competitorInput}...` : 'Processing 3,000+ data points...'}
                        </span>
                    </div>
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {suggestions.map((idea, i) => (
                        <div key={i} className="bg-black/40 border border-white/10 p-5 rounded-xl hover:border-purple-500/50 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                                    {idea.topic}
                                </span>
                                {idea.predictedPerformance === 'High' && (
                                    <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        High Prob.
                                    </span>
                                )}
                            </div>
                            <h3 className="text-white font-bold mb-2 group-hover:text-purple-300 transition-colors">
                                {idea.title}
                            </h3>
                            <p className="text-sm text-stone-400 border-t border-white/5 pt-3 mt-3">
                                <span className="text-xs text-stone-500 uppercase tracking-widest block mb-1">Why this works</span>
                                {idea.reasoning}
                            </p>
                        </div>
                    ))}
                    <div className="flex items-center justify-center">
                        <button
                            onClick={() => { setSuggestions([]); generate(); }}
                            className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all group"
                            title="Regenerate"
                        >
                            <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function KPICard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend?: string, color: string }) {
    return (
        <div className="relative group overflow-hidden bg-black border border-[#333] p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-2xl">
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
                <div className="text-3xl font-bold text-[#e7e9ea] tracking-tight font-mono">{value}</div>
                <div className="text-sm text-[#71767b] mt-1 font-medium">{title}</div>
            </div>
        </div>
    );
}
