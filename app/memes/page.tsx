"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import { UnifiedMemeWorkflow } from "@/components/UnifiedMemeWorkflow";
import { Sparkles, RefreshCw } from "lucide-react";

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
        <div className="flex min-h-screen bg-black text-[#e7e9ea]">
            <LeftSidebar />

            <main className="flex-1 w-full md:border-x border-[#333] min-h-screen flex flex-col pb-20 md:pb-0">
                {/* Header */}
                <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#333]">
                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-xl font-bold text-white flex items-center gap-2">
                                <Sparkles className="text-purple-500" /> Meme Studio
                            </h1>
                            <p className="text-xs md:text-sm text-[#71767b] mt-1">
                                Generate memes with AI → Convert to videos → Schedule to YouTube
                            </p>
                        </div>
                        <button
                            onClick={refreshAnalytics}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-400 transition-colors disabled:opacity-50 self-end md:self-auto"
                        >
                            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                            {isRefreshing ? "Updating..." : "Sync Analytics"}
                        </button>
                    </div>
                </div>

                {/* Unified Workflow */}
                <div className="p-4 md:p-6">
                    <UnifiedMemeWorkflow />
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
