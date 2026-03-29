"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Zap, 
  Sparkles, 
  Rocket, 
  Shield, 
  ArrowRight, 
  Activity, 
  Layout, 
  Clock, 
  Layers,
  CheckCircle2,
  Video,
  Smile,
  MessageSquare
} from "lucide-react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1E]">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-4 glass-effect shadow-lg" : "py-8"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A1A1E] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-xl">A.</span>
            </div>
            <span className="font-black text-xl tracking-tight">AgentX</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-bold text-[#6C757D] hover:text-[#1A1A1E] transition-colors">How it Works</a>
            <a href="#features" className="text-sm font-bold text-[#6C757D] hover:text-[#1A1A1E] transition-colors">Features</a>
            <Link href="/login" className="px-6 py-2.5 bg-[#1A1A1E] text-white rounded-xl text-sm font-bold hover:scale-105 transition-all active:scale-95">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-[-10%] w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E9ECEF] rounded-full text-[10px] font-black uppercase tracking-widest text-purple-600 mb-8 shadow-sm">
            <Sparkles size={14} />
            The Future of Content Creation
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8">
            Deploy your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600">Multiagent Swarm.</span>
          </h1>
          <p className="text-lg md:text-xl text-[#6C757D] font-medium max-w-2xl mx-auto mb-12">
            AgentX isn't just an app. It's an ecosystem of specialized AI agents working together to research, create, and grow your social presence 24/7.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-[#1A1A1E] text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-black/10">
              Get Started for Free <ArrowRight size={20} />
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto px-8 py-4 bg-white border border-[#E9ECEF] text-[#1A1A1E] rounded-2xl text-lg font-bold hover:bg-[#F8F9FA] transition-all">
              Watch Demo
            </a>
          </div>
        </div>
      </section>

      {/* Multiagent Explanation Section */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">How the Swarm Works</h2>
            <p className="text-[#6C757D] font-medium max-w-xl">Each agent is a specialized primitive designed to master one part of the content lifecycle.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AgentCard 
              icon={<Zap className="text-purple-600" />}
              name="Visionary Agent"
              role="Trend Research"
              description="Scans social signals and search trends to identify what's about to go viral before it peaks."
            />
            <AgentCard 
              icon={<MessageSquare className="text-blue-600" />}
              name="Creative Agent"
              role="Scripting & Design"
              description="Crafts high-engagement hooks, viral scripts, and stunning visual concepts for your brand."
            />
            <AgentCard 
              icon={<Video className="text-pink-600" />}
              name="Render Agent"
              role="Media Synthesis"
              description="Orchestrates high-fidelity video rendering and image generation with frame-perfect precision."
            />
            <AgentCard 
              icon={<Rocket className="text-emerald-600" />}
              name="Growth Agent"
              role="Posting & Analytics"
              description="Automatically schedules posts for peak reach and analyzes performance to optimize the next loop."
            />
          </div>

          {/* Connected Flow Visualization */}
          <div className="mt-20 p-10 bg-[#1A1A1E] rounded-[3rem] text-white relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-purple-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-lg">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-purple-400 mb-6 border border-white/10">
                  <Layers size={14} />
                  Seamless Integration
                </div>
                <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">Your Identity. <br/>Personalized Connections.</h3>
                <p className="text-gray-400 font-medium mb-8">
                  Security is our priority. When you sign up, your swarm is isolated. You connect your own YouTube, Twitter, and TikTok accounts. We never share credentials or data between users.
                </p>
                <div className="space-y-4">
                  {[
                    "Zero shared credentials",
                    "Persistent device sessions",
                    "Isolated agent execution",
                    "Full ownership of produced content"
                  ].map(item => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      <span className="font-bold">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full lg:w-1/2 aspect-video glass-effect rounded-[2rem] border-white/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 animate-pulse"></div>
                <div className="flex items-center gap-4">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-white/50 animate-bounce transition-all duration-1000" style={{ animationDelay: '0ms' }}>
                     <Smile size={32} />
                  </div>
                  <div className="w-12 h-[2px] bg-white/20"></div>
                  <div className="p-8 bg-white/10 rounded-3xl border border-white/20 text-white shadow-2xl scale-110">
                     <Activity size={40} />
                  </div>
                  <div className="w-12 h-[2px] bg-white/20"></div>
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-white/50 animate-bounce transition-all duration-1000" style={{ animationDelay: '500ms' }}>
                     <Rocket size={32} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-[#E9ECEF]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#1A1A1E] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">A.</span>
              </div>
              <span className="font-black text-lg tracking-tight">AgentX</span>
            </div>
            <p className="text-[#6C757D] text-sm font-medium">Built by visionaries for creator economy.</p>
          </div>
          <div className="flex items-center gap-10">
            <a href="#" className="text-sm font-bold text-[#6C757D] hover:text-[#1A1A1E] transition-colors">Twitter</a>
            <a href="#" className="text-sm font-bold text-[#6C757D] hover:text-[#1A1A1E] transition-colors">YouTube</a>
            <a href="#" className="text-sm font-bold text-[#6C757D] hover:text-[#1A1A1E] transition-colors">Privacy</a>
          </div>
          <p className="text-[#6C757D] text-sm font-bold uppercase tracking-widest">© 2025 AGENTX AI</p>
        </div>
      </footer>
    </div>
  );
}

function AgentCard({ icon, name, role, description }: { icon: React.ReactNode, name: string, role: string, description: string }) {
  return (
    <div className="premium-card p-10 rounded-[2.5rem] bg-white group hover:border-purple-600/30 transition-all duration-500">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
        {icon}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-[#6C757D] mb-1">{role}</div>
      <h3 className="text-xl font-black mb-4">{name}</h3>
      <p className="text-sm font-medium text-[#6C757D] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
