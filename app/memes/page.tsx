"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import { UnifiedMemeWorkflow } from "@/components/UnifiedMemeWorkflow";
import { Sparkles, RefreshCw, Zap, Video, TrendingUp } from "lucide-react";

export default function MemePage() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshAnalytics = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/youtube/analytics');
            const data = await res.json();
            if (data.success) {
                alert(data.message);
            } else {
                // failures are expected if no videos or no account
                console.log(data);
            }
        } catch (e) {
            console.error("Failed to refresh analytics", e);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F5F5F7]">
            <LeftSidebar />

            <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-8">
                {/* Top Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-[#e5e5e7]">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-[#000] to-[#333] rounded-xl">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">
                                        Meme Studio
                                    </h1>
                                    <p className="text-xs md:text-sm text-[#86868b] mt-0.5">
                                        Generate memes with AI → Convert to videos → Schedule to YouTube
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={refreshAnalytics}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F5F5F7] border border-[#e5e5e7] rounded-xl text-sm font-medium text-[#1d1d1f] transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                            >
                                <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                                {isRefreshing ? "Updating..." : "Sync Analytics"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6">
                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FeatureCard
                            icon={<Zap className="w-5 h-5" />}
                            title="AI-Powered Memes"
                            description="Generate viral memes using advanced AI technology"
                            color="from-[#000] to-[#333]"
                        />
                        <FeatureCard
                            icon={<Video className="w-5 h-5" />}
                            title="Video Conversion"
                            description="Transform memes into engaging video content"
                            color="from-[#1a1a1a] to-[#000]"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            title="Smart Scheduling"
                            description="Schedule posts at optimal times for maximum reach"
                            color="from-[#333] to-[#1a1a1a]"
                        />
                    </div>

                    {/* Unified Workflow */}
                    <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                        <UnifiedMemeWorkflow />
                    </div>
                </div>
            </main>
            <MobileNav />
        </div>
    );
}

function FeatureCard({ icon, title, description, color }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}) {
    return (
        <div className="bg-white border border-[#e5e5e7] rounded-xl p-5 hover:shadow-lg transition-shadow">
            <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${color} text-white mb-3`}>
                {icon}
            </div>
            <h3 className="font-bold text-[#1d1d1f] mb-1">{title}</h3>
            <p className="text-sm text-[#86868b]">{description}</p>
        </div>
    );
}
