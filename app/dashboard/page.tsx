"use client";

import { useState, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Rocket, Sparkles, Smile, Upload, Activity } from "lucide-react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";

export default function DashboardPage() {
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

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <LeftSidebar />

      <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-8">
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
                  Dashboard
                </h1>
                <p className="text-[10px] md:text-[11px] font-medium text-gray-500 mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                  Upload & scheduling center
                </p>
              </div>
            </div>
            <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-wider ${schedulerStatus?.status === 'RUNNING'
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-400 border-gray-200'
              }`}>
              <div className={`w-1 h-1 rounded-full ${schedulerStatus?.status === 'RUNNING' ? 'bg-white' : 'bg-gray-300'}`} />
              {schedulerStatus?.status === 'RUNNING' ? 'Scheduler Active' : 'Scheduler Offline'}
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/autopilot" className="bg-white border border-[#E9ECEF] rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Rocket className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-black mb-2">Auto-Pilot</h2>
              <p className="text-sm text-gray-500">Manage bulk uploads and scheduling tasks automatically.</p>
            </Link>

            <Link href="/quotes" className="bg-white border border-[#E9ECEF] rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-black mb-2">Quotes</h2>
              <p className="text-sm text-gray-500">Generate and schedule elegant quote videos.</p>
            </Link>

            <Link href="/memes" className="bg-white border border-[#E9ECEF] rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Smile className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-black mb-2">Meme Studio</h2>
              <p className="text-sm text-gray-500">Create trending meme content.</p>
            </Link>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
