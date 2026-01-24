"use client";

import { useState, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { Bell, Search, ChevronDown, TrendingUp, Clock, Users, Video } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduledPosts: 0,
    totalVideos: 0,
    totalViews: 0
  });

  const [weeklyData, setWeeklyData] = useState([
    { day: 'mon', hours: 0 },
    { day: 'tue', hours: 1.5 },
    { day: 'wed', hours: 2.5 },
    { day: 'thu', hours: 1 },
    { day: 'fri', hours: 4 },
    { day: 'sat', hours: 3 },
    { day: 'sun', hours: 2 }
  ]);

  useEffect(() => {
    // Fetch analytics data
    fetch('/api/analytics/stats')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(data.stats);
          if (data.stats.weeklyActivity) {
            setWeeklyData(data.stats.weeklyActivity);
          }
        }
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  const maxHours = Math.max(...weeklyData.map(d => d.hours));

  const features = [
    {
      icon: "🐦",
      title: "Twitter Agent",
      description: "AI-powered tweet generation and scheduling",
      duration: "Quick Setup",
      rating: 4.9,
      href: "/"
    },
    {
      icon: "💬",
      title: "Quotes Studio",
      description: "Create beautiful quote videos for social media",
      duration: "5-10 min",
      rating: 4.8,
      href: "/quotes"
    },
    {
      icon: "😂",
      title: "Meme Generator",
      description: "Viral meme creation with AI assistance",
      duration: "3-5 min",
      rating: 4.7,
      href: "/memes"
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Track performance and engagement metrics",
      duration: "Real-time",
      rating: 4.6,
      href: "/analytics"
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <LeftSidebar />

      <main className="flex-1 ml-0 md:ml-0">
        {/* Top Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-10 border-b border-[#e5e5e7]">
          <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1d1d1f]">Hello Josh!</h1>
              <p className="text-sm text-[#86868b] mt-0.5">It's good to see you again.</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868b]" size={18} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-[#f5f5f7] rounded-lg border border-transparent focus:border-[#000] focus:outline-none text-sm w-64"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-[#f5f5f7] rounded-lg transition-colors">
                <Bell size={20} className="text-[#1d1d1f]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
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
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stats & Features */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Link href="/analytics" className="bg-white rounded-2xl p-6 border border-[#e5e5e7] hover:shadow-lg transition-shadow group">
                  <div className="text-4xl font-bold text-[#1d1d1f] group-hover:text-[#000]">{stats.totalPosts}</div>
                  <div className="text-sm text-[#86868b] mt-1 group-hover:text-[#1d1d1f] transition-colors">Posts completed</div>
                </Link>
                <Link href="/analytics" className="bg-white rounded-2xl p-6 border border-[#e5e5e7] hover:shadow-lg transition-shadow group">
                  <div className="text-4xl font-bold text-[#1d1d1f] group-hover:text-[#000]">{stats.scheduledPosts}</div>
                  <div className="text-sm text-[#86868b] mt-1 group-hover:text-[#1d1d1f] transition-colors">Posts scheduled</div>
                </Link>
              </div>

              {/* Features List */}
              <div className="bg-white rounded-2xl p-6 border border-[#e5e5e7]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#1d1d1f]">Features</h2>
                  <div className="flex gap-2 text-sm">
                    <button className="px-4 py-1.5 rounded-full bg-[#000] text-white font-medium">All Features</button>
                    <button className="px-4 py-1.5 rounded-full text-[#86868b] hover:bg-[#f5f5f7] font-medium">Popular</button>
                  </div>
                </div>

                <div className="space-y-3">
                  {features.map((feature, idx) => (
                    <Link
                      key={idx}
                      href={feature.href}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#fafafa] transition-colors group border border-transparent hover:border-[#e5e5e7]"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f5f5f7] to-[#e5e5e7] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {feature.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#1d1d1f]">{feature.title}</h3>
                        <p className="text-sm text-[#86868b]">{feature.description}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-[#86868b]">
                          <Clock size={14} />
                          <span>{feature.duration}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#1d1d1f] font-medium">⭐ {feature.rating}</span>
                        </div>
                        <button className="px-4 py-2 bg-[#000] text-white rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Open
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Analytics */}
            <div className="space-y-6">
              {/* Statistics Chart */}
              <div className="bg-white rounded-2xl p-6 border border-[#e5e5e7]">
                <div className="flex items-center justify-between mb-6">
                  <Link href="/analytics" className="text-lg font-bold text-[#1d1d1f] hover:underline">Your statistics</Link>
                  <select className="text-sm text-[#86868b] bg-transparent border-none outline-none cursor-pointer">
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-sm text-[#86868b]">Daily Uploads</div>
                </div>

                {/* Chart */}
                <div className="relative h-48 flex items-end justify-between gap-2 mb-4">
                  {weeklyData.map((data, idx) => {
                    const height = maxHours > 0 ? (data.hours / maxHours) * 100 : 0;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full h-40 flex items-end">
                          <Link href="/analytics"
                            className="w-full bg-gradient-to-t from-[#000] to-[#333] rounded-t-lg relative group cursor-pointer hover:opacity-80 transition-opacity block"
                            style={{ height: `${height}%` }}
                          >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#000] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {data.hours}
                            </div>
                          </Link>
                        </div>
                        <span className="text-xs text-[#86868b] uppercase">{data.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Learn More Card */}
              <div className="bg-gradient-to-br from-[#f5f5f7] to-white rounded-2xl p-6 border border-[#e5e5e7] relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-[#1d1d1f] mb-2">Learn even more!</h3>
                  <p className="text-sm text-[#86868b] mb-4">
                    Unlock premium features only for $9.99 per month.
                  </p>
                  <button className="bg-[#000] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#333] transition-colors">
                    Go Premium
                  </button>
                </div>
                <div className="absolute right-4 bottom-4 text-6xl opacity-10">📚</div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Link href="/analytics" className="bg-white rounded-xl p-4 border border-[#e5e5e7] hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-2 mb-2">
                    <Video size={18} className="text-[#86868b] group-hover:text-[#1d1d1f]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1d1d1f]">{stats.totalVideos}</div>
                  <div className="text-xs text-[#86868b]">Videos created</div>
                </Link>
                <Link href="/analytics" className="bg-white rounded-xl p-4 border border-[#e5e5e7] hover:shadow-md transition-shadow group">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-[#86868b] group-hover:text-[#1d1d1f]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1d1d1f]">{stats.totalViews}</div>
                  <div className="text-xs text-[#86868b]">Total views</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
