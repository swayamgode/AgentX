"use client";

import { useState, useEffect, useMemo } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import {
  Bell, Search, ChevronDown, TrendingUp, Clock, Users, Video,
  BarChart3, Eye, ThumbsUp, MessageSquare, Calendar, RefreshCw,
  AlertCircle, ArrowUpRight, Play, Activity, Zap, Loader2
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
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

export default function Home() {
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
    return [...videos].reverse().map(v => {
      const date = new Date(v.uploadedAt);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
        shortName: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
      .slice(0, 5);
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

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <LeftSidebar />

      <main className="flex-1 ml-0 md:ml-0">
        {/* Top Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-10 border-b border-[#e5e5e7]">
          <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1d1d1f]">Hello Josh!</h1>
              <p className="text-sm text-[#86868b] mt-0.5">Here's your performance overview.</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e5e7] hover:bg-[#fafafa] rounded-lg text-xs font-medium text-[#86868b] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? 'Syncing...' : 'Sync Data'}
              </button>
              {/* Profile */}
              <div className="flex items-center gap-2 cursor-pointer hover:bg-[#f5f5f7] px-3 py-2 rounded-lg transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#000] to-[#333] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">J</span>
                </div>
                <ChevronDown size={16} className="text-[#86868b]" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">
          {loading && !videos.length ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-[#1d1d1f]" size={32} />
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span>{error}</span>
                  </div>
                  {(error.toLowerCase().includes('expired') || error.toLowerCase().includes('auth') || error.toLowerCase().includes('connect')) && (
                    <Link
                      href="/settings"
                      className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold transition-colors shadow-sm"
                    >
                      Reconnect YouTube
                    </Link>
                  )}
                </div>
              )}

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Views"
                  value={formatNumber(stats.totalViews)}
                  icon={<Eye className="w-5 h-5 text-[#1d1d1f]" />}
                  trend="+12%"
                  color="bg-blue-50"
                  textColor="text-blue-600"
                />
                <KPICard
                  title="Avg. Views / Video"
                  value={formatNumber(stats.avgViews)}
                  icon={<TrendingUp className="w-5 h-5 text-[#1d1d1f]" />}
                  trend="+5%"
                  color="bg-purple-50"
                  textColor="text-purple-600"
                />
                <KPICard
                  title="Total Interaction"
                  value={formatNumber(stats.totalLikes + stats.totalComments)}
                  icon={<ThumbsUp className="w-5 h-5 text-[#1d1d1f]" />}
                  trend="+8%"
                  color="bg-orange-50"
                  textColor="text-orange-600"
                />
                <KPICard
                  title="Content Library"
                  value={videos.length.toString()}
                  icon={<Video className="w-5 h-5 text-[#1d1d1f]" />}
                  trend="Videos"
                  color="bg-emerald-50"
                  textColor="text-emerald-600"
                />
              </div>

              {/* Charts Row 1: Growth Trend */}
              <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-[#1d1d1f] flex items-center gap-2">
                      <Activity className="w-5 h-5 text-purple-600" />
                      Growth Trajectory
                    </h2>
                    <p className="text-sm text-[#86868b] mt-1">View count progression over recent uploads</p>
                  </div>
                  <div className="text-xs font-mono text-[#86868b] bg-[#f5f5f7] px-3 py-1 rounded-full border border-[#e5e5e7]">
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" vertical={false} />
                      <YAxis
                        stroke="#e5e5e7"
                        tick={{ fill: '#86868b', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        dx={-10}
                        tickFormatter={(value) => formatNumber(value)}
                      />
                      <Tooltip
                        cursor={{ stroke: '#e5e5e7', strokeWidth: 1 }}
                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e5e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#1d1d1f' }}
                        labelStyle={{ color: '#86868b', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}
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
                <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Niche Performance
                  </h2>
                  <p className="text-sm text-[#86868b] mb-6">Top performing content categories</p>

                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e7" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={100}
                          tick={{ fill: '#86868b', fontSize: 13, fontWeight: 500 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: '#f5f5f7', radius: 4 }}
                          contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e5e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#1d1d1f' }}
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
                <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm flex flex-col">
                  <h2 className="text-xl font-bold text-[#1d1d1f] mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-pink-500" />
                    Engagement Mix
                  </h2>
                  <p className="text-sm text-[#86868b] mb-6">Distribution of user interactions</p>

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
                            contentStyle={{ backgroundColor: '#fff', borderColor: '#e5e5e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#1d1d1f' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-[#86868b] text-sm flex flex-col items-center gap-2">
                        <AlertCircle className="w-8 h-8 opacity-50" />
                        No engagement data yet
                      </div>
                    )}
                    {/* Center Statistic */}
                    {engagementData.length > 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <span className="text-3xl font-bold text-[#1d1d1f]">
                          {formatNumber(stats.totalLikes + stats.totalComments)}
                        </span>
                        <span className="text-xs text-[#86868b] uppercase tracking-widest">Total</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Videos Table */}
              <div className="bg-white border border-[#e5e5e7] rounded-2xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-[#e5e5e7] flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#1d1d1f]">Recent Uploads</h2>
                  <button className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors uppercase tracking-wider">
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#86868b]">
                    <thead className="bg-[#f5f5f7] text-[#86868b] font-medium">
                      <tr>
                        <th className="px-6 py-4 rounded-tl-lg">Content</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Views</th>
                        <th className="px-6 py-4 text-right">Likes</th>
                        <th className="px-6 py-4 text-right rounded-tr-lg">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e7]">
                      {videos.slice(0, 10).map((video) => (
                        <tr key={video.youtubeId} className="hover:bg-[#fafafa] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-24 h-14 bg-[#f5f5f7] rounded-lg overflow-hidden flex-shrink-0 relative group shadow-sm border border-[#e5e5e7]">
                                {video.thumbnailUrl ? (
                                  <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-[#f5f5f7]"><Video className="w-6 h-6 text-[#86868b]" /></div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                  <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                              </div>
                              <div className="max-w-[250px]">
                                <div className="font-semibold text-[#1d1d1f] truncate" title={video.title}>{video.title}</div>
                                <div className="text-xs text-[#86868b] mt-1 flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-[#f5f5f7] border border-[#e5e5e7] text-[#86868b]">{video.topic || 'General'}</span>
                                  <span>•</span>
                                  <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                              Public
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#1d1d1f] font-mono tracking-tight">
                            {formatNumber(parseInt(video.stats?.viewCount || '0'))}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-[#86868b]">
                            {formatNumber(parseInt(video.stats?.likeCount || '0'))}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <a
                              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#86868b] hover:text-[#1d1d1f] p-2 hover:bg-[#f5f5f7] rounded-lg transition-all inline-block"
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

            </>
          )}
        </div>
      </main>
    </div>
  );
}

function KPICard({ title, value, icon, trend, color, textColor }: { title: string, value: string, icon: React.ReactNode, trend?: string, color: string, textColor: string }) {
  return (
    <div className="relative group overflow-hidden bg-white border border-[#e5e5e7] p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg shadow-sm">

      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-200 flex items-center gap-1">
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
