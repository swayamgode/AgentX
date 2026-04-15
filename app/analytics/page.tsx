'use client';

import { useState, useEffect } from 'react';
import { LeftSidebar } from '@/components/LeftSidebar';
import { MobileNav } from '@/components/MobileNav';
import {
    BarChart3, CheckCircle, XCircle, TrendingUp, Youtube, AlertTriangle,
    RefreshCw, Clock, Zap, Activity, ArrowRight, ExternalLink
} from 'lucide-react';

interface AnalyticsSummary {
    total: number;
    success: number;
    failed: number;
    successRate: number;
    byChannel: { channelName: string; total: number; success: number; failed: number; rate: number }[];
    byErrorType: { type: string; count: number }[];
    recentUploads: {
        id: string; timestamp: string; accountId: string; channelName: string; topic: string;
        success: boolean; videoId?: string; videoUrl?: string; error?: string; errorType?: string;
    }[];
    last24h: { total: number; success: number; failed: number };
    last7d: { total: number; success: number; failed: number };
}

const ERROR_LABELS: Record<string, string> = {
    QUOTA_EXCEEDED: 'Quota Exceeded',
    AUTH_EXPIRED: 'Auth Expired',
    RENDER_FAILED: 'Render Failed',
    UNKNOWN: 'Unknown Error',
};

const ERROR_COLORS: Record<string, string> = {
    QUOTA_EXCEEDED: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    AUTH_EXPIRED: 'text-red-400 bg-red-500/10 border-red-500/20',
    RENDER_FAILED: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    UNKNOWN: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

function RateBar({ rate, success, total }: { rate: number; success: number; total: number }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                        width: `${rate}%`,
                        background: rate >= 80 ? 'linear-gradient(90deg,#22c55e,#4ade80)' :
                            rate >= 50 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' :
                                'linear-gradient(90deg,#ef4444,#f87171)'
                    }}
                />
            </div>
            <span className={`text-xs font-black tabular-nums w-10 text-right ${rate >= 80 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {rate}%
            </span>
        </div>
    );
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        try {
            const res = await fetch('/api/youtube/analytics');
            if (!res.ok) throw new Error('Failed to fetch analytics');
            const json = await res.json();
            setData(json);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(), 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredUploads = data?.recentUploads.filter(u =>
        filter === 'all' ? true : filter === 'success' ? u.success : !u.success
    ) ?? [];

    return (
        <div className="flex min-h-screen bg-[#000000] text-white">
            <LeftSidebar />

            <main className="flex-1 pb-24 md:pb-8 relative overflow-hidden">
                {/* Background orbs */}
                <div className="pointer-events-none absolute top-[-15%] left-[-5%] w-[35%] h-[35%] bg-emerald-600/10 rounded-full blur-[120px]" />
                <div className="pointer-events-none absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />

                {/* Header */}
                <div className="sticky top-0 z-30 bg-black/70 backdrop-blur-2xl border-b border-white/10">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-blue-500 rounded-xl blur-md opacity-40" />
                                <div className="relative w-9 h-9 md:w-11 md:h-11 rounded-xl bg-black border border-white/20 flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-sm md:text-xl font-black tracking-tighter italic text-white">UPLOAD ANALYTICS</h1>
                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest hidden md:block">Success · Failures · Channels</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 relative z-10">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">Loading Analytics...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <XCircle className="w-12 h-12 text-red-500/50" />
                            <p className="text-gray-400 text-sm">{error}</p>
                            <button onClick={() => fetchData()} className="px-4 py-2 bg-white/10 rounded-xl text-sm font-bold hover:bg-white/20 transition-all">
                                Retry
                            </button>
                        </div>
                    ) : data ? (
                        <>
                            {/* ── Summary Cards ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                {[
                                    {
                                        label: 'Total Uploads', value: data.total.toLocaleString(),
                                        icon: <Youtube className="w-4 h-4" />, sub: `Last 24h: ${data.last24h.total}`,
                                        color: 'from-blue-500 to-indigo-500', glow: 'shadow-blue-500/20',
                                    },
                                    {
                                        label: 'Successful', value: data.success.toLocaleString(),
                                        icon: <CheckCircle className="w-4 h-4" />, sub: `Last 24h: ${data.last24h.success}`,
                                        color: 'from-emerald-500 to-green-500', glow: 'shadow-emerald-500/20',
                                    },
                                    {
                                        label: 'Failed', value: data.failed.toLocaleString(),
                                        icon: <XCircle className="w-4 h-4" />, sub: `Last 24h: ${data.last24h.failed}`,
                                        color: 'from-red-500 to-rose-500', glow: 'shadow-red-500/20',
                                    },
                                    {
                                        label: 'Success Rate', value: `${data.successRate}%`,
                                        icon: <TrendingUp className="w-4 h-4" />, sub: `Last 7d: ${data.last7d.total} total`,
                                        color: data.successRate >= 80 ? 'from-emerald-500 to-teal-500' : data.successRate >= 50 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500',
                                        glow: data.successRate >= 80 ? 'shadow-emerald-500/20' : 'shadow-amber-500/20',
                                    },
                                ].map((stat, i) => (
                                    <div key={i} className={`relative bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-4 md:p-6 overflow-hidden shadow-lg ${stat.glow} hover:bg-white/[0.08] transition-all`}>
                                        <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl rounded-full`} />
                                        <div className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${stat.color} text-white mb-3 shadow-md`}>
                                            {stat.icon}
                                        </div>
                                        <div className="text-2xl md:text-3xl font-black text-white tracking-tighter">{stat.value}</div>
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{stat.label}</div>
                                        <div className="text-[9px] text-gray-600 mt-1 font-medium">{stat.sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Success Rate Bar ── */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-7">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-gray-400" />
                                        <h2 className="text-xs font-black text-white uppercase tracking-wider">Overall Success Rate</h2>
                                    </div>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${data.successRate >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : data.successRate >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                                        {data.successRate >= 80 ? '🟢 Healthy' : data.successRate >= 50 ? '🟡 Degraded' : '🔴 Critical'}
                                    </span>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
                                    <div
                                        className="h-full rounded-full relative overflow-hidden transition-all duration-1000"
                                        style={{
                                            width: `${data.successRate}%`,
                                            background: data.successRate >= 80 ? 'linear-gradient(90deg,#059669,#10b981)' : data.successRate >= 50 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#dc2626,#ef4444)'
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] text-gray-600 font-bold font-mono">
                                    <span>0%</span>
                                    <span className={data.successRate >= 80 ? 'text-emerald-500' : data.successRate >= 50 ? 'text-amber-500' : 'text-red-500'}>{data.successRate}%</span>
                                    <span>100%</span>
                                </div>
                                {/* Last 7 day breakdown */}
                                <div className="mt-4 grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Last 7 Days', total: data.last7d.total, success: data.last7d.success, failed: data.last7d.failed },
                                        { label: 'Last 24 Hours', total: data.last24h.total, success: data.last24h.success, failed: data.last24h.failed },
                                        { label: 'All Time', total: data.total, success: data.success, failed: data.failed },
                                    ].map((w, i) => (
                                        <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">{w.label}</p>
                                            <div className="flex gap-3 text-xs font-black">
                                                <span className="text-emerald-400">{w.success} ✓</span>
                                                <span className="text-red-400">{w.failed} ✗</span>
                                            </div>
                                            <RateBar rate={w.total > 0 ? Math.round((w.success / w.total) * 100) : 0} success={w.success} total={w.total} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Middle Row: Channel Breakdown + Error Types ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                                {/* Channel Breakdown */}
                                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <Youtube className="w-4 h-4 text-red-400" />
                                        <h2 className="text-xs font-black text-white uppercase tracking-wider">Per Channel Breakdown</h2>
                                        <span className="ml-auto text-[9px] text-gray-600 font-bold">{data.byChannel.length} channels</span>
                                    </div>
                                    {data.byChannel.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <Youtube className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                            <p className="text-gray-600 text-xs">No channel data yet. Run Auto-Pilot to start tracking.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                                            {data.byChannel.map((ch, i) => (
                                                <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5 hover:bg-white/[0.08] transition-all group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-white truncate max-w-[60%]">{ch.channelName}</span>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold flex-shrink-0">
                                                            <span className="text-emerald-400">{ch.success}✓</span>
                                                            <span className="text-red-400">{ch.failed}✗</span>
                                                            <span className="text-gray-500">/{ch.total}</span>
                                                        </div>
                                                    </div>
                                                    <RateBar rate={ch.rate} success={ch.success} total={ch.total} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Error Types */}
                                <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                                        <h2 className="text-xs font-black text-white uppercase tracking-wider">Failure Reasons</h2>
                                    </div>
                                    {data.byErrorType.length === 0 ? (
                                        <div className="py-12 text-center">
                                            <CheckCircle className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                                            <p className="text-gray-600 text-xs">No failures recorded!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {data.byErrorType.map((e, i) => {
                                                const pct = data.failed > 0 ? Math.round((e.count / data.failed) * 100) : 0;
                                                return (
                                                    <div key={i} className={`rounded-xl p-3 border ${ERROR_COLORS[e.type] || ERROR_COLORS.UNKNOWN}`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-black">{ERROR_LABELS[e.type] || e.type}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black">{e.count}</span>
                                                                <span className="text-[9px] opacity-60">({pct}%)</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-1 bg-black/20 rounded-full overflow-hidden">
                                                            <div className="h-full bg-current opacity-50 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div className="pt-2 border-t border-white/5 text-[9px] text-gray-600 font-bold">
                                                Total failures: {data.failed} • Fix auth expired issues in Settings → YouTube Accounts
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Recent Uploads ── */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-6">
                                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <h2 className="text-xs font-black text-white uppercase tracking-wider">Recent Uploads</h2>
                                    </div>
                                    <div className="flex gap-1 bg-white/5 rounded-xl p-0.5 border border-white/10">
                                        {(['all', 'success', 'failed'] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${filter === f ? 'bg-[#111]text-zinc-100' : 'text-gray-500 hover:text-white'}`}
                                            >
                                                {f === 'all' ? `All (${data.recentUploads.length})` : f === 'success' ? `✓ OK (${data.recentUploads.filter(u => u.success).length})` : `✗ Fail (${data.recentUploads.filter(u => !u.success).length})`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {filteredUploads.length === 0 ? (
                                    <div className="py-16 text-center">
                                        <Zap className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                                        <p className="text-gray-600 text-xs">No uploads tracked yet.</p>
                                        <p className="text-gray-700 text-[10px] mt-1">Uploads from Auto-Pilot will appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                                        {filteredUploads.map((u) => (
                                            <div
                                                key={u.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:bg-white/[0.05] ${u.success ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-red-500/10 bg-red-500/5'}`}
                                            >
                                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${u.success ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                                    {u.success
                                                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                        : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[11px] font-bold text-white truncate">{u.channelName}</span>
                                                        {u.topic && (
                                                            <span className="text-[9px] font-bold text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/10 flex-shrink-0">#{u.topic}</span>
                                                        )}
                                                        {!u.success && u.errorType && (
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${ERROR_COLORS[u.errorType] || ERROR_COLORS.UNKNOWN}`}>
                                                                {ERROR_LABELS[u.errorType] || u.errorType}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {!u.success && u.error && (
                                                        <p className="text-[9px] text-red-400/70 mt-0.5 truncate">{u.error}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {u.success && u.videoUrl && (
                                                        <a
                                                            href={u.videoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-600 hover:text-white transition-all"
                                                            title="Open on YouTube"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                    <span className="text-[9px] text-gray-600 font-mono whitespace-nowrap">
                                                        {new Date(u.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </main>

            <MobileNav />
        </div>
    );
}
