"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { QuotesGenerator } from "@/components/QuotesGenerator";
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
        <div className="flex justify-center min-h-screen bg-black text-[#e7e9ea]">
            <div className="flex w-full max-w-[1265px]">
                <LeftSidebar />

                <main className="flex-1 min-w-0 border-x border-[#333] min-h-screen flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 sticky top-0 bg-black/80 backdrop-blur-md p-4 z-40 border-b border-[#333]">
                        <h1 className="text-xl font-bold text-white">Quotes Studio</h1>
                        <button
                            onClick={refreshAnalytics}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-400 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                            {isRefreshing ? "Updating..." : "Sync Analytics"}
                        </button>
                    </div>

                    <div className="p-4">
                        <QuotesGenerator />
                    </div>
                </main>
            </div>
        </div>
    );
}
