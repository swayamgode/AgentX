"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import { UnifiedMemeWorkflow } from "@/components/UnifiedMemeWorkflow";
import { Sparkles, RefreshCw, Zap, Video, TrendingUp } from "lucide-react";

export default function MemePage() {


    return (
        <div className="flex min-h-screen bg-[#F8F9FA]">
            <LeftSidebar />

            <main className="flex-1 pb-20 md:pb-12">
                {/* Top Header */}
                <div className="sticky top-5 mx-8 rounded-[2rem] glass-effect z-40 border-white/20 shadow-lg">
                    <div className="max-w-[1400px] mx-auto px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-gradient-to-tr from-[#1A1A1E] to-[#333] flex items-center justify-center rounded-2xl shadow-lg animate-float">
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-[#1A1A1E] tracking-tight">
                                        Meme Studio
                                    </h1>
                                    <p className="text-sm font-medium text-[#6C757D] mt-1">
                                        AI-Powered Content Generation & Scheduling
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-[1400px] mx-auto px-8 py-10 space-y-10">
                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={<Zap className="w-5 h-5 text-white" />}
                            title="AI-Powered Memes"
                            description="Generate viral memes using advanced AI technology"
                            color="bg-gradient-to-tr from-[#1A1A1E] to-[#333]"
                        />
                        <FeatureCard
                            icon={<Video className="w-5 h-5 text-white" />}
                            title="Video Conversion"
                            description="Transform memes into engaging video content"
                            color="bg-gradient-to-tr from-[#333] to-[#444]"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-5 h-5 text-white" />}
                            title="Smart Scheduling"
                            description="Schedule posts at optimal times for maximum reach"
                            color="bg-gradient-to-tr from-[#222] to-[#111]"
                        />
                    </div>

                    {/* Unified Workflow */}
                    <div className="bg-white border border-[#E9ECEF] rounded-[2.5rem] p-10 shadow-sm premium-card">
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
        <div className="bg-white border border-[#E9ECEF] rounded-[2rem] p-8 hover:shadow-2xl transition-all premium-card">
            <div className={`inline-flex p-4 rounded-2xl ${color} text-white mb-6 shadow-lg`}>
                {icon}
            </div>
            <h3 className="text-lg font-black text-[#1A1A1E] mb-2 tracking-tight">{title}</h3>
            <p className="text-sm font-medium text-[#6C757D] leading-relaxed">{description}</p>
        </div>
    );
}
