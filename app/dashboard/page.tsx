"use client";

import { useState, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import {
  Rocket, Sparkles, Smile, Activity, ArrowRight,
  CheckCircle, Clock, XCircle, BarChart3, TrendingUp, Zap
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const fetchSchedulerStatus = async () => {
    try {
      const res = await fetch('/api/scheduler/status');
      const data = await res.json();
      setSchedulerStatus(data);
    } catch (e) {
      console.error('Failed to fetch scheduler status');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/youtube/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Failed to fetch analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchSchedulerStatus();
    fetchAnalytics();
    const interval = setInterval(fetchSchedulerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const successRate = analytics
    ? analytics.total > 0
      ? Math.round((analytics.success / analytics.total) * 100)
      : 100
    : null;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-indigo-500/30">
      <LeftSidebar />

      <main className="flex-1 ml-0 md:ml-0 pb-28 md:pb-8 relative">

        {/* Header */}
        <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <Activity className="text-zinc-300 w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white tracking-tight">
                  Dashboard
                </h1>
                <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1.5 uppercase tracking-widest font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  System Online
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-[10px] font-medium uppercase tracking-widest transition-all ${schedulerStatus?.status === 'RUNNING'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-white/5 text-zinc-400 border-white/10'
              }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${schedulerStatus?.status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="hidden xs:inline">{schedulerStatus?.status === 'RUNNING' ? 'Engine Running' : 'Engine Idle'}</span>
              <span className="xs:hidden">{schedulerStatus?.status === 'RUNNING' ? 'Running' : 'Idle'}</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8 relative z-10">

          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <DashboardCard
              href="/autopilot"
              icon={<Rocket className="w-6 h-6" />}
              title="Auto-Pilot"
              desc="Full-scale automation swarm. Multi-channel scheduling & generation."
            />
            <DashboardCard
              href="/quotes"
              icon={<Sparkles className="w-6 h-6" />}
              title="Quotes Flow"
              desc="Generate aesthetic high-retention quote videos with AI."
            />
            <DashboardCard
              href="/memes"
              icon={<Smile className="w-6 h-6" />}
              title="Meme Forge"
              desc="Trending high-organic reach meme content generator."
            />
          </div>

          {/* Live Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Active Channels"
              value={schedulerStatus?.accountsCount ?? '–'}
              icon={<Activity size={14} />}
              loading={false}
            />
            <MetricCard
              label="Pending Batch"
              value={schedulerStatus?.pendingCount ?? '0'}
              icon={<Clock size={14} />}
              loading={false}
            />
            <MetricCard
              label="Success Rate"
              value={loadingAnalytics ? '…' : successRate !== null ? `${successRate}%` : 'N/A'}
              icon={<CheckCircle size={14} />}
              loading={loadingAnalytics}
              highlight={successRate !== null ? (successRate >= 80 ? 'emerald' : successRate >= 50 ? 'amber' : 'red') : undefined}
            />
            <MetricCard
              label="Total Uploads"
              value={loadingAnalytics ? '…' : analytics?.total?.toLocaleString() ?? '0'}
              icon={<TrendingUp size={14} />}
              loading={loadingAnalytics}
            />
          </div>

          {/* Analytics Quick Panel */}
          {!loadingAnalytics && analytics && analytics.total > 0 && (
            <div className="bg-[#111] border border-white/10 rounded-xl p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-xs font-semibold text-white uppercase tracking-wider">Upload Analytics</h2>
                </div>
                <Link
                  href="/analytics"
                  className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Full Report <ArrowRight size={11} />
                </Link>
              </div>

              {/* Rate bar */}
              <div className="mb-5">
                <div className="flex justify-between text-[11px] font-medium mb-2">
                  <span className="text-zinc-400">Success Rate</span>
                  <span className={successRate! >= 80 ? 'text-emerald-500' : successRate! >= 50 ? 'text-amber-500' : 'text-red-500'}>
                    {successRate}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${successRate}%`,
                      background: successRate! >= 80 ? '#10b981' : successRate! >= 50 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '24h Uploads', value: analytics.last24h?.total ?? 0, color: 'text-zinc-100' },
                  { label: '24h Success', value: analytics.last24h?.success ?? 0, color: 'text-emerald-500' },
                  { label: '24h Failed', value: analytics.last24h?.failed ?? 0, color: 'text-red-500' },
                ].map((s, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/5 text-center transition-colors hover:bg-white/10">
                    <div className={`text-xl font-semibold ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Per-channel mini breakdown */}
              {analytics.byChannel?.length > 0 && (
                <div className="mt-5 space-y-2.5">
                  {analytics.byChannel.slice(0, 4).map((ch: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[11px] text-zinc-400 font-medium truncate w-32 flex-shrink-0">{ch.channelName}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${ch.rate}%`,
                            background: ch.rate >= 80 ? '#10b981' : ch.rate >= 50 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-300 w-10 text-right tabular-nums">{ch.rate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics CTA if no data */}
          {!loadingAnalytics && (!analytics || analytics.total === 0) && (
            <Link
              href="/analytics"
              className="block bg-[#111] border border-dashed border-white/10 rounded-xl p-6 text-center group hover:bg-white/5 transition-all"
            >
              <Zap className="w-6 h-6 text-zinc-600 mx-auto mb-3 group-hover:text-emerald-500 transition-colors" />
              <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
                No upload analytics yet — Run Auto-Pilot to start tracking
              </p>
              <p className="text-[11px] text-zinc-500 mt-2 font-medium">View Analytics →</p>
            </Link>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

function MetricCard({
  label, value, icon, loading, highlight
}: {
  label: string; value: string | number; icon: React.ReactNode;
  loading?: boolean; highlight?: 'emerald' | 'amber' | 'red';
}) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-4 md:p-5 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-2 text-zinc-500 mb-3">
        {icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl md:text-2xl font-semibold ${loading ? 'animate-pulse text-zinc-600' : highlight === 'emerald' ? 'text-emerald-500' : highlight === 'amber' ? 'text-amber-500' : highlight === 'red' ? 'text-red-500' : 'text-zinc-100'}`}>
        {value}
      </div>
    </div>
  );
}

function DashboardCard({ href, icon, title, desc }: any) {
  return (
    <Link
      href={href}
      className="group relative bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col justify-between hover:bg-white/5 transition-colors h-48"
    >
      <div className="flex items-center gap-4 text-zinc-300">
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            {icon}
        </div>
        <h2 className="text-lg font-semibold text-zinc-100 group-hover:text-white transition-colors">
          {title}
        </h2>
      </div>

      <div className="mt-4">
        <p className="text-sm text-zinc-400 font-medium leading-relaxed">
          {desc}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 transition-colors">
        Access Module <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
