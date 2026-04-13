"use client";

import { useState, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Rocket, Sparkles, Smile, Upload, Activity, ArrowRight, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

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
    <div className="flex min-h-screen bg-[#000000] text-white selection:bg-purple-500/30">
      <LeftSidebar />

      <main className="flex-1 ml-0 md:ml-0 pb-28 md:pb-8 relative overflow-hidden">
        {/* Abstract Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 shadow-[0_0_150px_rgba(147,51,234,0.3)] rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 shadow-[0_0_150px_rgba(37,99,235,0.2)] rounded-full blur-[100px]"></div>

        <div className="sticky top-0 md:top-5 mx-0 md:mx-8 rounded-none md:rounded-[2.5rem] bg-white/5 backdrop-blur-3xl z-40 border-b md:border border-white/10 shadow-2xl transition-all">
          <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-3 md:py-7 flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-7">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-blue-500 rounded-xl md:rounded-2xl blur-lg opacity-40 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-black border border-white/20 flex items-center justify-center shadow-2xl">
                  <Activity className="text-white w-5 h-5 md:w-7 md:h-7 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-base md:text-3xl font-black text-white tracking-tighter leading-none italic">
                  COMMAND
                </h1>
                <p className="text-[8px] md:text-[11px] font-bold text-gray-400 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Online
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${schedulerStatus?.status === 'RUNNING'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-white/5 text-gray-500 border-white/10'
              }`}>
              <div className={`w-1 h-1 rounded-full ${schedulerStatus?.status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
              <span className="hidden xs:inline">{schedulerStatus?.status === 'RUNNING' ? 'Engine Running' : 'Engine Idle'}</span>
              <span className="xs:hidden">{schedulerStatus?.status === 'RUNNING' ? 'Running' : 'Idle'}</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 md:py-16 space-y-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <DashboardCard 
              href="/autopilot" 
              icon={<Rocket className="w-7 h-7" />} 
              title="Auto-Pilot" 
              desc="Full-scale automation swarm. Multi-channel scheduling & generation."
              color="from-purple-600 to-indigo-600"
            />

            <DashboardCard 
              href="/quotes" 
              icon={<Sparkles className="w-7 h-7" />} 
              title="Quotes Flow" 
              desc="Generate aesthetic high-retention quote videos with AI."
              color="from-blue-600 to-cyan-600"
            />

            <DashboardCard 
              href="/memes" 
              icon={<Smile className="w-7 h-7" />} 
              title="Meme Forge" 
              desc="Trending high-organic reach meme content generator."
              color="from-orange-600 to-rose-600"
            />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {[
              { label: 'Active Channels', value: schedulerStatus?.accountsCount || '0', icon: <Activity size={14}/> },
              { label: 'Pending Batch', value: schedulerStatus?.pendingCount || '0', icon: <Clock size={14}/> },
              { label: 'Success Rate', value: '98%', icon: <CheckCircle size={14}/> },
              { label: 'Uptime', value: '24/7', icon: <Rocket size={14}/> }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-md">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  {stat.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="text-xl md:text-2xl font-black text-white">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

function DashboardCard({ href, icon, title, desc, color }: any) {
  return (
    <Link 
      href={href} 
      className="group relative bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 transition-all hover:-translate-y-2 hover:bg-white/[0.08] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-20 blur-[40px] transition-opacity`}></div>
      
      <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${color} text-white rounded-2xl md:rounded-3xl flex items-center justify-center mb-6 md:mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      
      <div className="relative z-10">
        <h2 className="text-xl md:text-2xl font-black text-white mb-2 md:mb-3 tracking-tight italic group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400">
          {title.toUpperCase()}
        </h2>
        <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium">
          {desc}
        </p>
      </div>

      <div className="mt-6 md:mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
        Access Module <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
