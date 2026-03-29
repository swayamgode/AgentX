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
    Loader2,
    Clock
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
    Legend,
    LineChart,
    Line
} from 'recharts';

interface VideoAnalytics {
    youtubeId: string;
    title: string;
    topic: string;
    templateId: string;
    texts: string[];
    thumbnailUrl?: string;
    uploadedAt: string;
    channelId?: string;
    channelName?: string;
    stats?: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
        lastUpdated: string;
    };
}

interface AccountInfo {
    id: string;
    channelName: string;
    channelId: string;
}

const COLORS = ['#1d1d1f', '#333333', '#666666', '#999999', '#cccccc'];

export default function AnalyticsPage() {
    const [videos, setVideos] = useState<VideoAnalytics[]>([]);
    const [accounts, setAccounts] = useState<AccountInfo[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>('all');
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

            if (data.accounts) {
                setAccounts(data.accounts);
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

    // Filter videos by selected account
    const filteredVideos = useMemo(() => {
        if (selectedAccount === 'all') {
            return videos;
        }
        return videos.filter(v => v.channelId === selectedAccount);
    }, [videos, selectedAccount]);

    // --- Data Processing for Charts ---

    const stats = useMemo(() => {
        const totalViews = filteredVideos.reduce((acc, v) => acc + parseInt(v.stats?.viewCount || '0'), 0);
        const totalLikes = filteredVideos.reduce((acc, v) => acc + parseInt(v.stats?.likeCount || '0'), 0);
        const totalComments = filteredVideos.reduce((acc, v) => acc + parseInt(v.stats?.commentCount || '0'), 0);
        const avgViews = filteredVideos.length > 0 ? Math.round(totalViews / filteredVideos.length) : 0;

        return { totalViews, totalLikes, totalComments, avgViews };
    }, [filteredVideos]);

    const growthData = useMemo(() => {
        // Reverse for chronological order (oldest to newest)
        return [...filteredVideos].reverse().map(v => {
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
    }, [filteredVideos]);

    const topicData = useMemo(() => {
        const topicMap: Record<string, number> = {};
        filteredVideos.forEach(v => {
            const topic = v.topic || 'Other';
            const views = parseInt(v.stats?.viewCount || '0');
            topicMap[topic] = (topicMap[topic] || 0) + views;
        });
        return Object.entries(topicMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
    }, [filteredVideos]);

    // Hourly Data
    const hourlyData = useMemo(() => {
        const hourMap: { [key: number]: { views: number, count: number } } = {};

        filteredVideos.forEach(v => {
            const date = new Date(v.uploadedAt);
            const hour = date.getHours();
            const views = parseInt(v.stats?.viewCount || '0');

            if (!hourMap[hour]) {
                hourMap[hour] = { views: 0, count: 0 };
            }

            hourMap[hour].views += views;
            hourMap[hour].count += 1;
        });

        return Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            hourLabel: `${i.toString().padStart(2, '0')}:00`,
            totalViews: hourMap[i]?.views || 0,
            videoCount: hourMap[i]?.count || 0,
        })).filter(d => d.videoCount > 0);
    }, [filteredVideos]);

    // Daily Data
    const dailyData = useMemo(() => {
        const dayMap: { [key: string]: { views: number, count: number } } = {};

        filteredVideos.forEach(v => {
            const date = new Date(v.uploadedAt);
            const dayKey = date.toISOString().split('T')[0];
            const views = parseInt(v.stats?.viewCount || '0');

            if (!dayMap[dayKey]) {
                dayMap[dayKey] = { views: 0, count: 0 };
            }

            dayMap[dayKey].views += views;
            dayMap[dayKey].count += 1;
        });

        return Object.entries(dayMap)
            .map(([date, stats]) => ({
                date,
                dateLabel: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views: stats.views,
                videoCount: stats.count,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-14); // Last 14 days
    }, [filteredVideos]);

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
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#1d1d1f]" size={32} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-[#F8F9FA] text-[#1A1A1E]">
            <LeftSidebar />

            <main className="flex-1 min-h-screen flex flex-col pb-20 md:pb-0">
                {/* Header */}
                <div className="sticky top-5 mx-8 rounded-[2rem] glass-effect z-40 border-white/20 shadow-lg">
                    <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1A1A1E] to-[#333] flex items-center justify-center shadow-lg animate-float">
                                <BarChart3 className="text-white w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-[#1A1A1E] tracking-tight flex items-center gap-2">
                                     Analytics Hub
                                </h1>
                                <p className="text-sm font-medium text-[#6C757D] mt-1 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-[#8B5CF6]" />
                                    Live performance tracking & insights
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {/* Account Filter */}
                            {accounts.length > 1 && (
                                <select
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    className="flex-1 md:flex-initial bg-white/50 border border-[#E9ECEF] rounded-xl px-4 py-2 text-sm font-bold text-[#1A1A1E] focus:outline-none focus:border-[#8B5CF6] transition-all hover:bg-white"
                                >
                                    <option value="all">All Accounts ({accounts.length})</option>
                                    {accounts.map(account => (
                                        <option key={account.id} value={account.channelId}>
                                            {account.channelName}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <button
                                onClick={() => fetchAnalytics(true)}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-black/90 text-white border-0 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 group"
                            >
                                <RefreshCw size={16} className={`${refreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
                                {refreshing ? 'Syncing...' : 'Sync Data'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-12 space-y-10">
                    {/* Ambient Background Glow - adjusted z-index to be behind content but inside main */}
                    <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-30">
                        <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-black/3 rounded-full blur-[120px]" />
                        <div className="absolute bottom-[-10%] right-[0%] w-[40%] h-[40%] bg-black/3 rounded-full blur-[120px]" />
                    </div>

                    <div className="relative z-10 space-y-6 md:space-y-8">

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between backdrop-blur-md flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <span>{error}</span>
                                </div>
                                {error.toLowerCase().includes('expired') || error.toLowerCase().includes('auth') || error.toLowerCase().includes('connect') ? (
                                    <Link
                                        href="/settings"
                                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 hover:text-red-800 border border-red-300 rounded-lg text-sm font-bold transition-all w-full md:w-auto text-center"
                                    >
                                        Reconnect YouTube
                                    </Link>
                                ) : null}
                            </div>
                        )}

                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KPICard
                                title="Total Views"
                                value={formatNumber(stats.totalViews)}
                                icon={<Eye className="w-6 h-6 text-white" />}
                                trend="+12%"
                                color="from-[#1A1A1E] to-[#333]"
                            />
                            <KPICard
                                title="Avg. Views / Video"
                                value={formatNumber(stats.avgViews)}
                                icon={<TrendingUp className="w-6 h-6 text-white" />}
                                trend="+5%"
                                color="from-[#1A1A1E] to-[#333]"
                            />
                            <KPICard
                                title="Total Interaction"
                                value={formatNumber(stats.totalLikes + stats.totalComments)}
                                icon={<ThumbsUp className="w-6 h-6 text-white" />}
                                trend="+8%"
                                color="from-[#1A1A1E] to-[#333]"
                            />
                            <KPICard
                                title="Content Library"
                                value={filteredVideos.length.toString()}
                                icon={<Video className="w-6 h-6 text-white" />}
                                trend="Videos"
                                color="from-[#1A1A1E] to-[#333]"
                            />
                        </div>

                        {/* Charts Row 1: Growth Trend */}
                        <div className="bg-white border border-[#e5e5e7] rounded-2xl p-4 md:p-6 overflow-hidden shadow-sm">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-2">
                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-[#1d1d1f]" />
                                        Growth Trajectory
                                    </h2>
                                    <p className="text-xs md:text-sm text-[#86868b] mt-1">View count progression over recent uploads</p>
                                </div>
                                <div className="text-xs font-mono text-[#86868b] bg-[#F5F5F7] px-3 py-1 rounded-full border border-[#e5e5e7]">
                                    Last {growthData.length} Videos
                                </div>
                            </div>
                            <div className="h-[250px] md:h-[350px] w-full -ml-4 md:ml-0 pr-4 md:pr-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData}>
                                        <defs>
                                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1d1d1f" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#1d1d1f" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" vertical={false} />
                                        <YAxis
                                            stroke="#86868b"
                                            tick={{ fill: '#86868b', fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                            tickFormatter={(value) => formatNumber(value)}
                                        />
                                        <Tooltip
                                            cursor={{ stroke: '#e5e5e7', strokeWidth: 1 }}
                                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ color: '#1d1d1f' }}
                                            labelStyle={{ color: '#86868b', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="views"
                                            stroke="#1d1d1f"
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
                            <div className="bg-white border border-[#e5e5e7] rounded-2xl p-4 md:p-6 shadow-sm">
                                <h2 className="text-lg md:text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-[#1d1d1f]" />
                                    Niche Performance
                                </h2>
                                <p className="text-xs md:text-sm text-[#86868b] mb-6">Top performing content categories</p>

                                <div className="h-[250px] md:h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topicData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={90}
                                                tick={{ fill: '#86868b', fontSize: 12, fontWeight: 500 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#F5F5F7', radius: 4 }}
                                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ color: '#1d1d1f' }}
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
                            <div className="bg-white border border-[#e5e5e7] rounded-2xl p-4 md:p-6 flex flex-col shadow-sm">
                                <h2 className="text-lg md:text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-[#1d1d1f]" />
                                    Engagement Mix
                                </h2>
                                <p className="text-xs md:text-sm text-[#86868b] mb-6">Distribution of user interactions</p>

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
                                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#1d1d1f' : '#999999'} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                    itemStyle={{ color: '#1d1d1f' }}
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
                                            <span className="text-2xl md:text-3xl font-bold text-[#1d1d1f]">
                                                {formatNumber(stats.totalLikes + stats.totalComments)}
                                            </span>
                                            <span className="text-xs text-[#86868b] uppercase tracking-widest">Total</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* Daily & Hourly View Counts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Daily View Counts */}
                            <div className="bg-white border border-[#e5e5e7] rounded-2xl p-4 md:p-6 shadow-sm">
                                <h2 className="text-lg md:text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[#1d1d1f]" />
                                    Daily View Counts
                                </h2>
                                <p className="text-xs md:text-sm text-[#86868b] mb-6">Total views per day (last 14 days)</p>

                                <div className="h-[250px] md:h-[300px] w-full">
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
                                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ color: '#1d1d1f' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="views"
                                                stroke="#1d1d1f"
                                                strokeWidth={3}
                                                dot={{ fill: '#1d1d1f', r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Hourly View Counts */}
                            <div className="bg-white border border-[#e5e5e7] rounded-2xl p-4 md:p-6 shadow-sm">
                                <h2 className="text-lg md:text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-[#1d1d1f]" />
                                    Hourly View Counts
                                </h2>
                                <p className="text-xs md:text-sm text-[#86868b] mb-6">Total views by hour of upload</p>

                                <div className="h-[250px] md:h-[300px] w-full">
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
                                                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ color: '#1d1d1f' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="totalViews"
                                                stroke="#666666"
                                                strokeWidth={3}
                                                dot={{ fill: '#666666', r: 4 }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>


                        {/* AI Strategy Engine */}
                        <div className="bg-[#F5F5F7] border border-[#e5e5e7] rounded-2xl p-4 md:p-6 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 p-3 opacity-20">
                                <Zap className="w-16 h-16 md:w-24 md:h-24 text-[#1d1d1f]" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-lg md:text-2xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-3">
                                    <span className="text-[#1d1d1f]">AI Strategy Engine</span>
                                    <span className="text-[10px] md:text-xs px-2 py-1 rounded bg-[#1d1d1f]/10 text-[#1d1d1f] border border-[#1d1d1f]/20">BETA</span>
                                </h2>
                                <p className="text-[#86868b] max-w-2xl mb-6 text-sm md:text-base">
                                    This model "trains" on your historical analytics data to identify winning patterns.
                                    It analyzes correlation between topics, keywords, and view velocity to suggest high-probability video ideas.
                                </p>

                                <StrategyGenerator />
                            </div>
                        </div>

                        {/* Recent Videos Table */}
                        <div className="bg-white border border-[#e5e5e7] rounded-2xl overflow-hidden shadow-sm">
                            <div className="p-4 md:p-6 border-b border-[#e5e5e7] flex justify-between items-center">
                                <h2 className="text-lg md:text-xl font-bold text-[#1d1d1f]">Recent Uploads</h2>
                                <button className="text-xs font-semibold text-[#1d1d1f] hover:text-black transition-colors uppercase tracking-wider">
                                    View All
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-[#71767b]">
                                    <thead className="bg-[#F5F5F7] text-[#86868b] font-medium hidden md:table-header-group">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-lg">Content</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Views</th>
                                            <th className="px-6 py-4 text-right">Likes</th>
                                            <th className="px-6 py-4 text-right rounded-tr-lg">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e5e5e7]">
                                        {filteredVideos.slice(0, 10).map((video) => (
                                            <tr key={video.youtubeId} className="hover:bg-[#F5F5F7] transition-colors group flex md:table-row flex-col">
                                                <td className="px-4 md:px-6 py-3 md:py-4">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="w-20 md:w-24 h-12 md:h-14 bg-[#F5F5F7] rounded-lg overflow-hidden flex-shrink-0 relative group shadow-sm border border-[#e5e5e7]">
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
                                                            <div className="font-semibold text-[#1d1d1f] truncate text-sm md:text-base" title={video.title}>{video.title}</div>
                                                            <div className="text-xs text-[#86868b] mt-1 flex items-center gap-2">
                                                                <span className="px-1.5 py-0.5 rounded bg-[#F5F5F7] border border-[#e5e5e7] text-[#86868b]">{video.topic || 'General'}</span>
                                                                <span>•</span>
                                                                <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 md:px-6 py-2 md:py-4 flex items-center justify-between md:table-cell">
                                                    <span className="md:hidden text-xs font-medium text-[#86868b]">Status</span>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#1d1d1f] text-white shadow-sm">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                        Public
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-6 py-2 md:py-4 text-right font-bold text-[#1d1d1f] font-mono tracking-tight flex items-center justify-between md:table-cell">
                                                    <span className="md:hidden text-xs font-normal text-[#86868b]">Views</span>
                                                    {formatNumber(parseInt(video.stats?.viewCount || '0'))}
                                                </td>
                                                <td className="px-4 md:px-6 py-2 md:py-4 text-right font-mono text-[#86868b] flex items-center justify-between md:table-cell">
                                                    <span className="md:hidden text-xs font-normal text-[#86868b]">Likes</span>
                                                    {formatNumber(parseInt(video.stats?.likeCount || '0'))}
                                                </td>
                                                <td className="px-4 md:px-6 py-2 md:py-4 text-right hidden md:table-cell">
                                                    <a
                                                        href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#86868b] hover:text-[#1d1d1f] p-2 hover:bg-[#F5F5F7] rounded-lg transition-all inline-block"
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
                        <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2 block">
                            Market Analysis (Optional)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={competitorInput}
                                onChange={(e) => setCompetitorInput(e.target.value)}
                                placeholder="Enter competitor channel (e.g. @MrBeast, @Veritasium)"
                                className="flex-1 bg-white border border-[#e5e5e7] rounded-xl px-4 py-3 text-[#1d1d1f] placeholder:text-gray-400 focus:outline-none focus:border-[#1d1d1f] transition-all font-mono text-sm"
                            />
                        </div>
                        <p className="text-xs text-[#86868b] mt-2">
                            Leave empty to train on your data only. Enter a handle to combine insights.
                        </p>
                    </div>

                    <button
                        onClick={generate}
                        className="w-full sm:w-auto px-6 py-3 bg-[#1d1d1f] text-white font-bold rounded-xl hover:bg-[#000] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                        <Zap className="w-5 h-5 fill-white" />
                        {competitorInput ? 'Analyze Market & Generate Strategy' : 'Train Model & Generate Ideas'}
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-[#1d1d1f]">
                    <Loader2 className="animate-spin w-8 h-8" />
                    <div className="text-center space-y-1">
                        <span className="font-bold block animate-pulse">Analyzing Pattern Data...</span>
                        <span className="text-sm text-[#86868b] block">
                            {competitorInput ? `Scraping public trends from ${competitorInput}...` : 'Processing 3,000+ data points...'}
                        </span>
                    </div>
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {suggestions.map((idea, i) => (
                        <div key={i} className="bg-white border border-[#e5e5e7] p-5 rounded-xl hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs font-mono text-[#1d1d1f] bg-[#F5F5F7] px-2 py-1 rounded border border-[#e5e5e7]">
                                    {idea.topic}
                                </span>
                                {idea.predictedPerformance === 'High' && (
                                    <span className="text-xs font-bold text-[#1d1d1f] flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        High Prob.
                                    </span>
                                )}
                            </div>
                            <h3 className="text-[#1d1d1f] font-bold mb-2 group-hover:text-black transition-colors">
                                {idea.title}
                            </h3>
                            <p className="text-sm text-[#86868b] border-t border-[#e5e5e7] pt-3 mt-3">
                                <span className="text-xs text-[#86868b] uppercase tracking-widest block mb-1">Why this works</span>
                                {idea.reasoning}
                            </p>
                        </div>
                    ))}
                    <div className="flex items-center justify-center">
                        <button
                            onClick={() => { setSuggestions([]); generate(); }}
                            className="p-4 rounded-full bg-white hover:bg-[#F5F5F7] border border-[#e5e5e7] text-[#1d1d1f] transition-all group shadow-sm"
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
        <div className="relative group overflow-hidden bg-white border border-[#e5e5e7] p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg">
            {/* Gradient Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

            <div className="relative z-10 flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg shadow-black/5`}>
                    {icon}
                </div>
                {trend && (
                    <span className="text-xs font-bold text-[#1d1d1f] bg-[#F5F5F7] px-2 py-1 rounded-lg border border-[#e5e5e7] flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {trend}
                    </span>
                )}
            </div>
            <div className="relative z-10">
                <div className="text-3xl font-bold text-[#1d1d1f] tracking-tight font-mono">{value}</div>
                <div className="text-sm text-[#86868b] mt-1 font-medium">{title}</div>
            </div>
        </div>
    );
}
