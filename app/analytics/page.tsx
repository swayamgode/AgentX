"use client";

import { useEffect, useState } from 'react';
import {
    BarChart3,
    Eye,
    ThumbsUp,
    MessageSquare,
    TrendingUp,
    Video,
    Calendar,
    RefreshCw,
    AlertCircle
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
                // Sort by uploadedAt descending default
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

    const formatNumber = (numStr: string | undefined) => {
        if (!numStr) return '0';
        const num = parseInt(numStr);
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const totalViews = videos.reduce((acc, v) => acc + parseInt(v.stats?.viewCount || '0'), 0);
    const totalLikes = videos.reduce((acc, v) => acc + parseInt(v.stats?.likeCount || '0'), 0);
    const totalComments = videos.reduce((acc, v) => acc + parseInt(v.stats?.commentCount || '0'), 0);

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                            Analytics Studio
                        </h1>
                        <p className="text-gray-400 mt-2">To track performance across all uploaded videos</p>
                    </div>
                    <button
                        onClick={() => fetchAnalytics(true)}
                        disabled={refreshing || loading}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card
                        title="Total Views"
                        value={formatNumber(totalViews.toString())}
                        icon={<Eye className="w-6 h-6 text-blue-400" />}
                        subtext="Across all videos"
                    />
                    <Card
                        title="Total Likes"
                        value={formatNumber(totalLikes.toString())}
                        icon={<ThumbsUp className="w-6 h-6 text-purple-400" />}
                        subtext="Engagement rate"
                    />
                    <Card
                        title="Comments"
                        value={formatNumber(totalComments.toString())}
                        icon={<MessageSquare className="w-6 h-6 text-pink-400" />}
                        subtext="Community interaction"
                    />
                    <Card
                        title="Total Videos"
                        value={videos.length.toString()}
                        icon={<Video className="w-6 h-6 text-green-400" />}
                        subtext="Uploaded content"
                    />
                </div>

                {/* Video Performance Grid */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <BarChart3 className="w-6 h-6" />
                        Video Performance
                    </h2>

                    {loading && videos.length === 0 ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="text-center py-20 bg-gray-900/50 rounded-2xl border border-gray-800">
                            <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-xl text-gray-400">No videos tracked yet.</p>
                            <p className="text-sm text-gray-500 mt-2">Upload videos using the studio to see analytics here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map((video) => (
                                <div key={video.youtubeId} className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden hover:border-gray-700 transition-all group backdrop-blur-sm">
                                    {/* Thumbnail Area */}
                                    <div className="aspect-video bg-gray-800 relative overflow-hidden">
                                        {video.thumbnailUrl ? (
                                            <img
                                                src={video.thumbnailUrl}
                                                alt={video.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <Video className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white">
                                            {video.topic}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 space-y-4">
                                        <div>
                                            <h3 className="font-medium line-clamp-2 text-lg group-hover:text-blue-400 transition-colors" title={video.title}>
                                                {video.title}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(video.uploadedAt).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-800/50">
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-400 text-xs mb-1">
                                                    <Eye className="w-3 h-3" />
                                                </div>
                                                <div className="font-bold text-sm">{formatNumber(video.stats?.viewCount)}</div>
                                            </div>
                                            <div className="text-center border-l border-gray-800/50">
                                                <div className="flex items-center justify-center gap-1 text-gray-400 text-xs mb-1">
                                                    <ThumbsUp className="w-3 h-3" />
                                                </div>
                                                <div className="font-bold text-sm">{formatNumber(video.stats?.likeCount)}</div>
                                            </div>
                                            <div className="text-center border-l border-gray-800/50">
                                                <div className="flex items-center justify-center gap-1 text-gray-400 text-xs mb-1">
                                                    <MessageSquare className="w-3 h-3" />
                                                </div>
                                                <div className="font-bold text-sm">{formatNumber(video.stats?.commentCount)}</div>
                                            </div>
                                        </div>

                                        <a
                                            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full text-center py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                                        >
                                            View on YouTube
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Card({ title, value, icon, subtext }: { title: string, value: string, icon: React.ReactNode, subtext: string }) {
    return (
        <div className="bg-gray-900/50 border border-gray-800/50 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                {icon}
            </div>
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gray-800 rounded-xl group-hover:bg-gray-700 transition-colors">
                    {icon}
                </div>
                <div className="text-sm text-gray-400 font-medium">{title}</div>
            </div>
            <div>
                <div className="text-3xl font-bold text-white mb-1">{value}</div>
                <div className="text-xs text-gray-500">{subtext}</div>
            </div>
        </div>
    );
}
