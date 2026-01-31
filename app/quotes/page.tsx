"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { QuotesGenerator } from "@/components/QuotesGenerator";
import { MobileNav } from "@/components/MobileNav";
import { RefreshCw } from "lucide-react";

export default function QuotesPage() {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const refreshAnalytics = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/youtube/analytics');
            const data = await res.json();
            if (data.success) {
                alert(data.message);
            } else {
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

            <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-0">
                {/* Top Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-[#e5e5e7]">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="w-full md:w-auto">
                            <h1 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">Quotes Studio</h1>
                            <p className="text-xs md:text-sm text-[#86868b] mt-0.5">Create stunning videos in seconds.</p>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <button
                                onClick={refreshAnalytics}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e5e7] hover:bg-[#f5f5f7] rounded-full text-xs md:text-sm font-bold text-[#1d1d1f] transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                                {isRefreshing ? "Syncing..." : "Sync Analytics"}
                            </button>

                            {/* Profile (Consistent with Home) */}
                            <div className="flex items-center gap-2 cursor-pointer hover:bg-[#f5f5f7] px-3 py-2 rounded-lg transition-colors">
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#000] to-[#333] flex items-center justify-center">
                                    <span className="text-white font-bold text-xs md:text-sm">J</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8">
                    <QuotesGenerator />
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
