"use client";

import { useState, useEffect, useMemo } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import {
  TrendingUp, Clock, Video,
  Eye, ThumbsUp, MessageSquare, Calendar, RefreshCw,
  AlertCircle, ArrowUpRight, Activity, Zap, Loader2,
  ChevronLeft, ChevronRight, BarChart3, Flame, Upload
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ComposedChart, Line
} from 'recharts';


interface VideoAnalytics {
  youtubeId: string;
  title: string;
  topic: string;
  templateId: string;
  texts: string[];
  thumbnailUrl?: string;
  uploadedAt: string;
  channelName?: string;
  channelId?: string;
  stats?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
    lastUpdated: string;
  };
}

interface DayData {
  date: string;
  label: string;
  shortLabel: string;
  dayOfWeek: string;
  uploads: number;
  views: number;
  likes: number;
  comments: number;
  engagement: number;
  videos: VideoAnalytics[];
  channels: Set<string>;
}

const CHART_COLORS = ['#000000', '#6366f1', '#ec4899', '#f59e0b', '#10b981'];
const CHANNEL_COLORS: Record<string, string> = {};
let colorIndex = 0;

function getChannelColor(name: string) {
  if (!CHANNEL_COLORS[name]) {
    CHANNEL_COLORS[name] = CHART_COLORS[colorIndex % CHART_COLORS.length];
    colorIndex++;
  }
  return CHANNEL_COLORS[name];
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<VideoAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d' | 'all'>('14d');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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
        const sorted = data.videos
          .filter((v: VideoAnalytics) => v.channelId !== 'UC_DEV_001')
          .sort((a: VideoAnalytics, b: VideoAnalytics) =>
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
        const userId = "dev-id-001";
        console.log('✅ Dashboard user:', userId);
    fetchAnalytics();
  }, []);

  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);

  const fetchSchedulerStatus = async () => {
    try {
      const res = await fetch('/api/scheduler/status');
      const data = await res.json();
      setSchedulerStatus(data);
    } catch (e) {
      console.error('Failed to fetch scheduler status');
    }
  };

  useEffect(() => {
    fetchSchedulerStatus();
    const interval = setInterval(fetchSchedulerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Aggregate videos by day
  const dayMap = useMemo(() => {
    const map = new Map<string, DayData>();

    videos.forEach(v => {
      const date = new Date(v.uploadedAt);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: dateKey,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          shortLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
          uploads: 0,
          views: 0,
          likes: 0,
          comments: 0,
          engagement: 0,
          videos: [],
          channels: new Set<string>(),
        });
      }

      const day = map.get(dateKey)!;
      const views = parseInt(v.stats?.viewCount || '0');
      const likes = parseInt(v.stats?.likeCount || '0');
      const comments = parseInt(v.stats?.commentCount || '0');

      day.uploads += 1;
      day.views += views;
      day.likes += likes;
      day.comments += comments;
      day.engagement += likes + comments;
      day.videos.push(v);
      if (v.channelName) day.channels.add(v.channelName);
    });

    return map;
  }, [videos]);

  // Filter by time range
  const filteredDays = useMemo(() => {
    const now = new Date();
    const days: DayData[] = [];

    dayMap.forEach((day) => {
      const dayDate = new Date(day.date);
      const diffDays = Math.ceil((now.getTime() - dayDate.getTime()) / 86400000);

      if (timeRange === 'all' ||
        (timeRange === '7d' && diffDays <= 7) ||
        (timeRange === '14d' && diffDays <= 14) ||
        (timeRange === '30d' && diffDays <= 30)) {
        days.push(day);
      }
    });

    return days.sort((a, b) => a.date.localeCompare(b.date));
  }, [dayMap, timeRange]);

  // Overall stats
  const stats = useMemo(() => {
    const totalViews = filteredDays.reduce((acc, d) => acc + d.views, 0);
    const totalLikes = filteredDays.reduce((acc, d) => acc + d.likes, 0);
    const totalComments = filteredDays.reduce((acc, d) => acc + d.comments, 0);
    const totalUploads = filteredDays.reduce((acc, d) => acc + d.uploads, 0);
    const activeDays = filteredDays.filter(d => d.uploads > 0).length;
    const avgViewsPerDay = activeDays > 0 ? Math.round(totalViews / activeDays) : 0;
    const avgUploadsPerDay = activeDays > 0 ? parseFloat((totalUploads / activeDays).toFixed(1)) : 0;
    const engagementRate = totalViews > 0
      ? parseFloat(((totalLikes + totalComments) / totalViews * 100).toFixed(2))
      : 0;

    // Best day
    let bestDay: DayData | null = null;
    filteredDays.forEach(d => {
      if (!bestDay || d.views > bestDay.views) bestDay = d;
    });

    // Channel breakdown
    const channelStats: Record<string, { views: number; uploads: number; likes: number }> = {};
    filteredDays.forEach(d => {
      d.videos.forEach(v => {
        const ch = v.channelName || 'Unknown';
        if (!channelStats[ch]) channelStats[ch] = { views: 0, uploads: 0, likes: 0 };
        channelStats[ch].views += parseInt(v.stats?.viewCount || '0');
        channelStats[ch].uploads += 1;
        channelStats[ch].likes += parseInt(v.stats?.likeCount || '0');
      });
    });

    return {
      totalViews, totalLikes, totalComments, totalUploads,
      activeDays, avgViewsPerDay, avgUploadsPerDay, engagementRate,
      bestDay: bestDay as DayData | null, channelStats
    };
  }, [filteredDays]);

  // Chart data for daily views & uploads
  const chartData = useMemo(() => {
    return filteredDays.map(d => ({
      name: d.shortLabel,
      day: d.dayOfWeek,
      date: d.date,
      views: d.views,
      likes: d.likes,
      comments: d.comments,
      uploads: d.uploads,
      engagement: d.engagement,
    }));
  }, [filteredDays]);

  // Channel pie data
  const channelPieData = useMemo(() => {
    return Object.entries(stats.channelStats)
      .map(([name, data]) => ({
        name: name.length > 14 ? name.slice(0, 12) + '…' : name,
        fullName: name,
        value: data.views,
        uploads: data.uploads,
      }))
      .sort((a, b) => b.value - a.value);
  }, [stats.channelStats]);

  // Heatmap data (uploads per day of week)
  const heatmapData = useMemo(() => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const map: Record<string, { uploads: number; views: number }> = {};
    weekDays.forEach(d => { map[d] = { uploads: 0, views: 0 }; });

    filteredDays.forEach(d => {
      const dow = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
      map[dow].uploads += d.uploads;
      map[dow].views += d.views;
    });

    return weekDays.map(d => ({ name: d, uploads: map[d].uploads, views: map[d].views }));
  }, [filteredDays]);

  // Selected day detail
  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    return dayMap.get(selectedDay) || null;
  }, [selectedDay, dayMap]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
          <p className="font-bold text-black mb-1">{label}</p>
          {payload.map((entry: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-gray-600">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.dataKey}:</span>
              <span className="font-bold text-black">{formatNumber(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <LeftSidebar />

      <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-8">
        {/* Top Header */}
        <div className="sticky top-5 mx-4 md:mx-8 rounded-[2rem] glass-effect z-40 border-white/20 shadow-lg">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-black flex items-center justify-center shadow-md">
                  <Activity className="text-white w-5 h-5 md:w-6 md:h-6" />
                </div>
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-black tracking-tight leading-none">
                  Analytics
                </h1>
                <p className="text-[10px] md:text-[11px] font-medium text-gray-500 mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar size={11} />
                  Day-by-day performance
                </p>
              </div>

              <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-wider ${schedulerStatus?.status === 'RUNNING'
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-400 border-gray-200'
                }`}>
                <div className={`w-1 h-1 rounded-full ${schedulerStatus?.status === 'RUNNING' ? 'bg-white' : 'bg-gray-300'}`} />
                {schedulerStatus?.status === 'RUNNING' ? 'Active' : 'Offline'}
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
              {/* Time Range Selector */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                {(['7d', '14d', '30d', 'all'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => { setTimeRange(range); setSelectedDay(null); }}
                    className={`px-2.5 md:px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all ${timeRange === range
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-500 hover:text-black'
                      }`}
                  >
                    {range === 'all' ? 'All' : range}
                  </button>
                ))}
              </div>

              <button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 md:px-4 py-2 bg-white border border-gray-200 hover:border-black rounded-lg text-xs font-bold text-black transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={`${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? 'Syncing' : 'Sync'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
          {loading && !videos.length ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-[#1d1d1f]" size={32} />
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm md:text-base">{error}</span>
                  </div>
                  {(error.toLowerCase().includes('expired') || error.toLowerCase().includes('auth') || error.toLowerCase().includes('connect')) && (
                    <Link
                      href="/settings"
                      className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold transition-colors shadow-sm w-full md:w-auto text-center"
                    >
                      Reconnect YouTube
                    </Link>
                  )}
                </div>
              )}

              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <KPICard
                  title="Total Views"
                  value={formatNumber(stats.totalViews)}
                  icon={<Eye className="w-4 h-4 md:w-5 md:h-5 text-black" />}
                  subtitle={`${stats.activeDays} active day${stats.activeDays !== 1 ? 's' : ''}`}
                />
                <KPICard
                  title="Avg Views / Day"
                  value={formatNumber(stats.avgViewsPerDay)}
                  icon={<TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-black" />}
                  subtitle="Per active day"
                />
                <KPICard
                  title="Total Uploads"
                  value={stats.totalUploads.toString()}
                  icon={<Upload className="w-4 h-4 md:w-5 md:h-5 text-black" />}
                  subtitle={`~${stats.avgUploadsPerDay}/day`}
                />
                <KPICard
                  title="Engagement"
                  value={`${stats.engagementRate}%`}
                  icon={<Flame className="w-4 h-4 md:w-5 md:h-5 text-black" />}
                  subtitle={`${formatNumber(stats.totalLikes)} likes`}
                />
                <KPICard
                  title="Best Day"
                  value={stats.bestDay ? formatNumber(stats.bestDay.views) : '—'}
                  icon={<Zap className="w-4 h-4 md:w-5 md:h-5 text-black" />}
                  subtitle={stats.bestDay?.shortLabel || 'No data'}
                  className="col-span-2 lg:col-span-1"
                />
              </div>

              {/* Main Chart: Daily Views & Uploads (Combined) */}
              <div className="bg-white border border-[#E9ECEF] rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 lg:p-10 shadow-sm overflow-hidden premium-card">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 gap-3">
                  <div>
                    <h2 className="text-base md:text-xl font-bold text-black flex items-center gap-2 tracking-tight">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                        <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" />
                      </div>
                      Daily Performance
                    </h2>
                    <p className="text-[10px] md:text-xs font-medium text-gray-500 mt-1 ml-9 md:ml-10">
                      Views and uploads aggregated by day
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] md:text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-1.5 rounded-full bg-black" /> Views
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" /> Uploads
                    </span>
                  </div>
                </div>
                <div className="h-[220px] md:h-[350px] w-full -ml-2 md:ml-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      onClick={(e: any) => {
                        if (e?.activePayload?.[0]?.payload?.date) {
                          setSelectedDay(
                            selectedDay === e.activePayload[0].payload.date
                              ? null
                              : e.activePayload[0].payload.date
                          );
                        }
                      }}
                    >
                      <defs>
                        <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#000000" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#e5e5e7"
                        tick={{ fill: '#86868b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="views"
                        stroke="#e5e5e7"
                        tick={{ fill: '#86868b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <YAxis
                        yAxisId="uploads"
                        orientation="right"
                        stroke="#e5e5e7"
                        tick={{ fill: '#86868b', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        yAxisId="uploads"
                        dataKey="uploads"
                        fill="#e5e5e7"
                        radius={[4, 4, 0, 0]}
                        barSize={24}
                        opacity={0.6}
                      />
                      <Area
                        yAxisId="views"
                        type="monotone"
                        dataKey="views"
                        stroke="#000000"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#viewsGradient)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                {chartData.length === 0 && (
                  <div className="text-center text-gray-400 text-sm py-8">
                    No data for this time range
                  </div>
                )}
              </div>

              {/* Day Detail Panel (shown when a day is clicked) */}
              {selectedDayData && (
                <div className="bg-white border border-black/10 rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-black">
                        {selectedDayData.dayOfWeek}, {selectedDayData.label}
                      </h3>
                      <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">
                        {selectedDayData.uploads} upload{selectedDayData.uploads !== 1 ? 's' : ''} across {selectedDayData.channels.size} channel{selectedDayData.channels.size !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-xs font-bold text-gray-400 hover:text-black transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>

                  {/* Day Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 md:mb-6">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Views</div>
                      <div className="text-lg md:text-xl font-bold text-black">{formatNumber(selectedDayData.views)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Likes</div>
                      <div className="text-lg md:text-xl font-bold text-black">{formatNumber(selectedDayData.likes)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Comments</div>
                      <div className="text-lg md:text-xl font-bold text-black">{formatNumber(selectedDayData.comments)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Uploads</div>
                      <div className="text-lg md:text-xl font-bold text-black">{selectedDayData.uploads}</div>
                    </div>
                  </div>

                  {/* Videos list for that day */}
                  <div className="space-y-2">
                    {selectedDayData.videos
                      .sort((a, b) => parseInt(b.stats?.viewCount || '0') - parseInt(a.stats?.viewCount || '0'))
                      .slice(0, 8)
                      .map(video => (
                        <div key={video.youtubeId} className="flex items-center gap-3 p-2.5 md:p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                          {/* Thumbnail */}
                          <div className="w-14 h-10 md:w-20 md:h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                            {video.thumbnailUrl ? (
                              <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs md:text-sm font-semibold text-black truncate">{video.title}</div>
                            <div className="text-[10px] md:text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 text-[9px] md:text-[10px] font-medium">
                                {video.channelName || 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 hidden sm:block">
                            <div className="text-xs md:text-sm font-bold text-black font-mono">
                              {formatNumber(parseInt(video.stats?.viewCount || '0'))}
                            </div>
                            <div className="text-[10px] text-gray-400">views</div>
                          </div>
                          <a
                            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pl-2 text-gray-300 group-hover:text-black transition-colors hidden sm:block"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    {selectedDayData.videos.length > 8 && (
                      <p className="text-center text-xs text-gray-400 pt-2">
                        +{selectedDayData.videos.length - 8} more videos
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Secondary Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Channel Performance Breakdown */}
                <div className="bg-white border border-[#E9ECEF] rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 lg:p-10 shadow-sm premium-card">
                  <h2 className="text-base md:text-lg font-bold text-black mb-1 flex items-center gap-2 tracking-tight">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                      <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" />
                    </div>
                    Channel Breakdown
                  </h2>
                  <p className="text-[10px] md:text-xs font-medium text-gray-500 mb-6 md:mb-8 ml-9 md:ml-10">
                    Views distribution across channels
                  </p>

                  {channelPieData.length > 0 ? (
                    <div className="h-[220px] md:h-[280px] w-full flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channelPieData}
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {channelPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }: any) => {
                              if (active && payload?.[0]) {
                                return (
                                  <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
                                    <p className="font-bold text-black">{payload[0].payload.fullName}</p>
                                    <p className="text-gray-500">{formatNumber(payload[0].value)} views</p>
                                    <p className="text-gray-400">{payload[0].payload.uploads} uploads</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl md:text-2xl font-bold text-black">{channelPieData.length}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">Channels</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
                      No channel data
                    </div>
                  )}

                  {/* Channel Legend */}
                  <div className="mt-4 space-y-2">
                    {channelPieData.map((ch, i) => (
                      <div key={ch.fullName} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-gray-600 truncate">{ch.fullName}</span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-mono font-bold text-black">{formatNumber(ch.value)}</span>
                          <span className="text-gray-400 w-12 text-right">{ch.uploads} vid</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Day-of-Week Heatmap + Engagement Chart */}
                <div className="space-y-4 md:space-y-6">
                  {/* Upload Rhythm */}
                  <div className="bg-white border border-[#E9ECEF] rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 lg:p-10 shadow-sm premium-card">
                    <h2 className="text-base md:text-lg font-bold text-black mb-1 flex items-center gap-2 tracking-tight">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" />
                      </div>
                      Upload Rhythm
                    </h2>
                    <p className="text-[10px] md:text-xs font-medium text-gray-500 mb-4 md:mb-6 ml-9 md:ml-10">
                      Activity by day of week
                    </p>
                    <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                      {heatmapData.map(d => {
                        const maxUploads = Math.max(...heatmapData.map(x => x.uploads), 1);
                        const intensity = d.uploads / maxUploads;
                        return (
                          <div key={d.name} className="text-center">
                            <div
                              className="aspect-square rounded-lg md:rounded-xl flex items-center justify-center transition-all"
                              style={{
                                backgroundColor: intensity > 0
                                  ? `rgba(0, 0, 0, ${0.05 + intensity * 0.85})`
                                  : '#f5f5f7'
                              }}
                            >
                              <span className={`text-xs md:text-sm font-bold ${intensity > 0.5 ? 'text-white' : 'text-gray-400'}`}>
                                {d.uploads}
                              </span>
                            </div>
                            <span className="text-[9px] md:text-[10px] font-bold text-gray-400 mt-1 block">{d.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Engagement Breakdown */}
                  <div className="bg-white border border-[#E9ECEF] rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 lg:p-10 shadow-sm premium-card">
                    <h2 className="text-base md:text-lg font-bold text-black mb-1 flex items-center gap-2 tracking-tight">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                        <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" />
                      </div>
                      Engagement
                    </h2>
                    <p className="text-[10px] md:text-xs font-medium text-gray-500 mb-4 md:mb-6 ml-9 md:ml-10">
                      Daily likes + comments trend
                    </p>
                    <div className="h-[140px] md:h-[180px] w-full -ml-2 md:ml-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: '#86868b', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <YAxis tick={{ fill: '#86868b', fontSize: 10 }} tickLine={false} axisLine={false} />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="likes" stroke="#6366f1" strokeWidth={2} fill="url(#engGrad)" />
                          <Area type="monotone" dataKey="comments" stroke="#ec4899" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Videos (Sorted by Views) */}
              <div className="bg-white border border-[#E9ECEF] rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-sm premium-card">
                <div className="px-4 md:px-8 py-5 md:py-8 border-b border-[#E9ECEF] flex justify-between items-center">
                  <div>
                    <h2 className="text-base md:text-xl font-bold text-black tracking-tight">Top Performing Videos</h2>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5">Ranked by views within selected period</p>
                  </div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    {timeRange === 'all' ? 'All Time' : `Last ${timeRange}`}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-[#f5f5f7] text-gray-500 font-medium hidden md:table-header-group">
                      <tr>
                        <th className="px-6 py-3 text-[10px] uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-[10px] uppercase tracking-wider">Video</th>
                        <th className="px-6 py-3 text-[10px] uppercase tracking-wider">Channel</th>
                        <th className="px-6 py-3 text-right text-[10px] uppercase tracking-wider">Views</th>
                        <th className="px-6 py-3 text-right text-[10px] uppercase tracking-wider">Likes</th>
                        <th className="px-6 py-3 text-right text-[10px] uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-[10px] uppercase tracking-wider w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f0f2]">
                      {(() => {
                        // Flatten all filtered day videos, sort by views
                        const allVideos = filteredDays.flatMap(d => d.videos);
                        const sorted = allVideos.sort((a, b) =>
                          parseInt(b.stats?.viewCount || '0') - parseInt(a.stats?.viewCount || '0')
                        );
                        return sorted.slice(0, 10).map((video, idx) => (
                          <tr key={video.youtubeId} className="hover:bg-[#fafafa] transition-colors group flex md:table-row flex-col">
                            <td className="px-4 md:px-6 py-2 md:py-4 hidden md:table-cell">
                              <span className={`text-sm font-bold ${idx < 3 ? 'text-black' : 'text-gray-300'}`}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-3 md:py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-10 md:w-20 md:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                  {video.thumbnailUrl ? (
                                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Video className="w-4 h-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="max-w-[180px] md:max-w-[250px]">
                                  <div className="font-semibold text-black truncate text-xs md:text-sm">{video.title}</div>
                                  <div className="text-[10px] text-gray-400 mt-0.5 md:hidden">
                                    {video.channelName} • {new Date(video.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-2 md:py-4 hidden md:table-cell">
                              <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                {video.channelName || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-2 md:py-4 text-right font-bold text-black font-mono text-xs md:text-sm flex items-center justify-between md:table-cell">
                              <span className="md:hidden text-[10px] font-normal text-gray-400">Views</span>
                              {formatNumber(parseInt(video.stats?.viewCount || '0'))}
                            </td>
                            <td className="px-4 md:px-6 py-2 md:py-4 text-right font-mono text-gray-400 text-xs hidden md:table-cell">
                              {formatNumber(parseInt(video.stats?.likeCount || '0'))}
                            </td>
                            <td className="px-4 md:px-6 py-2 md:py-4 text-right text-xs text-gray-400 hidden md:table-cell">
                              {new Date(video.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-4 md:px-6 py-2 md:py-4 text-right hidden md:table-cell">
                              <a
                                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-300 hover:text-black p-1.5 hover:bg-gray-50 rounded-lg transition-all inline-block"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </a>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                  {filteredDays.flatMap(d => d.videos).length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-12">
                      No videos in this time range
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}

function KPICard({ title, value, icon, subtitle, className = '' }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-white border border-gray-200 p-4 md:p-6 rounded-xl md:rounded-2xl transition-all hover:border-black shadow-sm ${className}`}>
      <div className="relative z-10 flex justify-between items-start mb-3 md:mb-4">
        <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-gray-50 border border-gray-100">
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-xl md:text-2xl font-bold text-black tracking-tighter leading-none">{value}</div>
        <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 mt-1.5 md:mt-2 font-bold">{title}</div>
        {subtitle && (
          <div className="text-[10px] md:text-xs text-gray-400 mt-0.5 font-medium">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
