"use client";

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Users, PlayCircle, MonitorPlay, ChevronRight, RefreshCw, Calendar } from 'lucide-react';

// ── Date helpers ──────────────────────────────────────────────────────────────
function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISODate(d);
}

// Apr 1 of the current year
function apr1() {
  return `${new Date().getFullYear()}-04-01`;
}

const TODAY = toISODate(new Date());

const PRESETS = [
  { label: 'Apr 1 → Today', start: apr1(), end: TODAY },
  { label: '7 Days',         start: daysAgo(7),  end: TODAY },
  { label: '30 Days',        start: daysAgo(30), end: TODAY },
  { label: '90 Days',        start: daysAgo(90), end: TODAY },
  { label: '1 Year',         start: daysAgo(365), end: TODAY },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [data, setData]                 = useState<any>(null);
  const [loading, setLoading]           = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [idle, setIdle]                 = useState(true);

  // Date range state (default: Apr 1 → Today)
  const [activePreset, setActivePreset] = useState(0);
  const [startDate, setStartDate]       = useState(PRESETS[0].start);
  const [endDate, setEndDate]           = useState(PRESETS[0].end);
  const [customStart, setCustomStart]   = useState('');
  const [customEnd, setCustomEnd]       = useState('');
  const [showCustom, setShowCustom]     = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [countdown, setCountdown]       = useState(60);

  // ── Auto-refresh logic ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || idle || loading) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchAnalytics();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, idle, loading, startDate, endDate]);

  // Initial fetch when going from idle to active
  useEffect(() => {
    if (!idle && isAuthenticated && !data) {
      fetchAnalytics();
    }
  }, [idle, isAuthenticated]);


  const selectPreset = (i: number) => {
    setActivePreset(i);
    setStartDate(PRESETS[i].start);
    setEndDate(PRESETS[i].end);
    setShowCustom(false);
  };

  const applyCustom = () => {
    if (!customStart || !customEnd) return;
    setStartDate(customStart);
    setEndDate(customEnd);
    setActivePreset(-1);
    setShowCustom(false);
  };

  const removeAccount = async (index: number) => {
    setLoading(true);
    await fetch('/api/analytics?index=' + index, { method: 'DELETE' });
    await fetchAnalytics(startDate, endDate);
  };

  const fetchAnalytics = async (sd = startDate, ed = endDate) => {
    try {
      setIdle(false);
      setLoading(true);
      const res  = await fetch(`/api/analytics?startDate=${sd}&endDate=${ed}`);
      const json = await res.json();

      if (json.needsAuth) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        setData(json.data);
        setLastRefreshed(new Date());
        setCountdown(60);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Idle splash ─────────────────────────────────────────────────────────────
  if (idle) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] animate-slide-up text-center">
        <div className="glass-panel p-12 max-w-lg w-full flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#ff2a5f] to-[#ff7a60] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ff2a5f]/30 mb-8">
            <Activity size={40} className="text-white" />
          </div>
          <h1 className="title text-gradient mb-2">Aura Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
            Select a date range and click Load to fetch your YouTube analytics.
          </p>

          {/* Preset pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => selectPreset(i)}
                style={{
                  padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  background: activePreset === i ? 'var(--accent)' : 'rgba(255,255,255,0.07)',
                  color: activePreset === i ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${activePreset === i ? 'var(--accent)' : 'var(--border)'}`,
                  transition: 'all 0.2s'
                }}
              >{p.label}</button>
            ))}
            <button
              onClick={() => setShowCustom(v => !v)}
              style={{
                padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                background: showCustom ? 'rgba(255,122,96,0.2)' : 'rgba(255,255,255,0.07)',
                color: showCustom ? '#ff7a60' : 'var(--text-secondary)',
                border: `1px solid ${showCustom ? '#ff7a60' : 'var(--border)'}`,
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            ><Calendar size={14} /> Custom</button>
          </div>

          {showCustom && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} max={customEnd || TODAY}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'white', fontSize: '0.85rem' }} />
              <span style={{ color: 'var(--text-secondary)' }}>→</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} min={customStart} max={TODAY}
                style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'white', fontSize: '0.85rem' }} />
              <button onClick={applyCustom} style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Apply</button>
            </div>
          )}

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Range: <strong style={{ color: 'var(--text-primary)' }}>{startDate}</strong> → <strong style={{ color: 'var(--text-primary)' }}>{endDate}</strong>
          </div>

          <button onClick={() => fetchAnalytics()} className="btn-primary w-full justify-center">
            Load Analytics
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] animate-slide-up">
        <div className="w-16 h-16 border-4 border-white/10 border-t-[#ff2a5f] rounded-full animate-spin mb-4"></div>
        <h2 className="title text-gradient">Fetching Analytics…</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{startDate} → {endDate}</p>
      </div>
    );
  }

  // ── Not authenticated ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] animate-slide-up text-center">
        <div className="glass-panel p-12 max-w-lg w-full flex flex-col items-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#ff2a5f] to-[#ff7a60] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ff2a5f]/30 mb-8 transform -rotate-12 hover:rotate-0 transition-transform">
            <MonitorPlay size={40} className="text-white" />
          </div>
          <h1 className="title text-gradient mb-2">Aura Analytics</h1>
          <p className="text-[var(--text-secondary)] mb-8">
            Connect your YouTube accounts to unlock AI-powered insights and beautiful data visualizations.
          </p>
          <a href="/api/auth" className="btn-primary w-full justify-center">
            Connect Google Account
            <ChevronRight size={18} />
          </a>
        </div>
      </div>
    );
  }

  const chartData = data?.timeSeriesData || [];

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up" style={{ width: '100%' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="title text-gradient">Command Center</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              Analytics: <strong style={{ color: 'var(--text-primary)' }}>{startDate}</strong> → <strong style={{ color: 'var(--text-primary)' }}>{endDate}</strong>
            </p>
            {lastRefreshed && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="live-pulse" /> Updated {lastRefreshed.toLocaleTimeString()} (Next in {countdown}s)
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="/api/auth" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', boxShadow: 'none' }}>
            + Add Account
          </a>
          <button onClick={() => setIdle(true)} style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Change Range
          </button>
          <button onClick={() => fetchAnalytics()} className="btn-primary" style={{ background: 'var(--surface)', color: 'white', border: '1px solid var(--border)', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </header>

      {/* Date Range Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px', alignItems: 'center' }}>
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => { selectPreset(i); fetchAnalytics(PRESETS[i].start, PRESETS[i].end); }}
            style={{
              padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              background: activePreset === i ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              color: activePreset === i ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${activePreset === i ? 'var(--accent)' : 'var(--border)'}`,
              transition: 'all 0.2s'
            }}
          >{p.label}</button>
        ))}
        <button
          onClick={() => setIdle(true)}
          style={{
            padding: '5px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            background: activePreset === -1 ? 'rgba(255,122,96,0.2)' : 'rgba(255,255,255,0.06)',
            color: activePreset === -1 ? '#ff7a60' : 'var(--text-secondary)',
            border: `1px solid ${activePreset === -1 ? '#ff7a60' : 'var(--border)'}`,
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px'
          }}
        ><Calendar size={12} /> Custom</button>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <KpiCard icon={<PlayCircle />} title="Total Views (Lifetime)" value={data?.totals?.views || "0"} trend="Global" isPositive={true} />
        <KpiCard icon={<Users />}       title="Subscribers (Lifetime)" value={data?.totals?.subscribers || "0"} trend="Global" isPositive={true} />
        <KpiCard icon={<MonitorPlay />} title="Channels Connected"     value={data?.accountsConnected || "0"} trend="Active" isPositive={true} />
        <KpiCard 
          icon={<Activity />}    
          title="Real-Time Status"            
          value="Streaming" 
          trend="Live" 
          isPositive={true} 
          hasPulse={true}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-panel" style={{ height: '420px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Daily Performance &mdash; {startDate} &rarr; {data?.dataRange?.end || endDate}
            </h3>
            <div style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '20px', padding: '3px 10px', whiteSpace: 'nowrap' }}>
              ⏱ Analytics data has a 48–72 h delay
            </div>
          </div>
          <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={0}>
            <AreaChart data={chartData}>
              <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', backdropFilter: 'blur(16px)' }}
                itemStyle={{ color: 'white' }}
                itemSorter={(item: any) => (item.value ? -Number(item.value) : 0)}
              />
              {data?.channels?.length > 0 ? (
                data.channels.map((ch: any, i: number) => {
                  const colors = ['#ff2a5f', '#ff7a60', '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];
                  return (
                    <Area key={`${ch.title}-${i}`} type="monotone" dataKey={ch.title} stroke={colors[i % colors.length]} fillOpacity={0.1} fill={colors[i % colors.length]} />
                  );
                })
              ) : (
                <Area type="monotone" dataKey="global_views" stroke="var(--accent)" fillOpacity={0.2} fill="var(--accent)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ height: '420px', overflowY: 'auto' }}>
          <h3 style={{ marginBottom: '24px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MonitorPlay size={20} className="text-[#ff2a5f]" />
            Connected
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...(data?.channels || [])]
              .sort((a: any, b: any) => {
                const parse = (v: string) => {
                  if (!v) return 0;
                  const n = parseFloat(v);
                  if (v.includes('M')) return n * 1_000_000;
                  if (v.includes('K')) return n * 1_000;
                  return n;
                };
                return parse(b.views) - parse(a.views);
              })
              .map((ch: any, i: number) => (
                <div key={`${ch.id}-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ['#ff2a5f', '#ff7a60', '#6366f1', '#ec4899', '#14b8a6'][i % 5] }} />
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{ch.title}</span>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{ch.views}</div>
                    <button onClick={() => removeAccount(ch.tokenIndex)} style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', background: 'transparent', border: 'none', padding: '0', cursor: 'pointer', marginTop: '2px' }}>Remove</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="glass-panel" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} className="text-[#2dd4bf]" />
                Live Video Activity
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Last updated: {lastRefreshed?.toLocaleTimeString()}</span>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {data?.recentVideos?.map((video: any) => (
                <div key={video.id} className="video-card">
                    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
                        <img src={video.thumbnail} alt={video.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                            {video.views} views
                        </div>
                    </div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '2.5rem' }}>
                        {video.title}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{video.channelTitle}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{new Date(video.publishedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, title, value, trend, isPositive, hasPulse }: any) {
  return (
    <div className="glass-panel kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
      {hasPulse && <div className="card-pulse-bg" />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ color: 'var(--text-secondary)' }}>{icon}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: isPositive ? 'rgba(45, 212, 191, 0.15)' : 'rgba(255, 42, 95, 0.15)', color: isPositive ? 'var(--success)' : 'var(--accent)' }}>
          {hasPulse && <span className="live-pulse" />}
          {trend}
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px', fontWeight: 500 }}>{title}</h4>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      </div>
    </div>
  );
}
