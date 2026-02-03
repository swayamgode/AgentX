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
        <div className="flex min-h-screen bg-black">
            <LeftSidebar />

            <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-8 border-x border-[#333]">
                {/* Top Header */}
                <div className="sticky top-0 bg-black/80 backdrop-blur-xl z-20 border-b border-[#333]">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl">
                                    <Sparkles className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-white">
                                        Meme Studio
                                    </h1>
                                    <p className="text-xs md:text-sm text-[#71767b] mt-0.5">
                                        Generate memes with AI → Convert to videos → Schedule to YouTube
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={refreshAnalytics}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-gray-300 transition-all disabled:opacity-50"
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
                            color="from-white to-gray-200"
                        />
                        <FeatureCard
                            icon={<Video className="w-5 h-5" />}
                            title="Video Conversion"
                            description="Transform memes into engaging video content"
                            color="from-white to-gray-200"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            title="Smart Scheduling"
                            description="Schedule posts at optimal times for maximum reach"
                            color="from-white to-gray-200"
                        />
                    </div>

                    {/* Unified Workflow */}
                    <div className="bg-black border border-[#333] rounded-2xl p-6">
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
        <div className="bg-black border border-[#333] rounded-xl p-5 hover:border-white/30 transition-all hover:-translate-y-1">
            <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${color} text-black mb-3`}>
                {icon}
            </div>
            <h3 className="font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-[#71767b]">{description}</p>
        </div>
    );
}
