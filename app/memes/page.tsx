"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import { UnifiedMemeWorkflow } from "@/components/UnifiedMemeWorkflow";
import { Sparkles, RefreshCw, Zap, Video, TrendingUp } from "lucide-react";

export default function MemePage() {


    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-indigo-500/30">
            <LeftSidebar />

            <main className="flex-1 pb-20 md:pb-12">
                {/* Top Header */}
                <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-row items-center justify-between gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-lg">
                                    <Sparkles className="w-5 h-5 text-zinc-300" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold text-white tracking-tight">
                                        Meme Studio
                                    </h1>
                                    <p className="text-[10px] md:text-sm font-medium text-zinc-400 mt-0.5">
                                        AI-Powered Content Generation & Scheduling
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8">
                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                        <FeatureCard
                            icon={<Zap className="w-5 h-5 text-zinc-300" />}
                            title="AI-Powered Memes"
                            description="Generate viral memes using advanced AI technology"
                        />
                        <FeatureCard
                            icon={<Video className="w-5 h-5 text-zinc-300" />}
                            title="Video Conversion"
                            description="Transform memes into engaging video content"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-5 h-5 text-zinc-300" />}
                            title="Smart Scheduling"
                            description="Schedule posts at optimal times for maximum reach"
                        />
                    </div>

                    {/* Unified Workflow */}
                    <div className="bg-[#111] border border-white/10 rounded-xl p-6 md:p-8">
                        <UnifiedMemeWorkflow />
                    </div>
                </div>
            </main>
            <MobileNav />
        </div>
    );
}

function FeatureCard({ icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color?: string;
}) {
    return (
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-4 text-zinc-300 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    {icon}
                </div>
                <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
            </div>
            <p className="text-sm font-medium text-zinc-400 leading-relaxed">{description}</p>
        </div>
    );
}
