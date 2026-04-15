"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { QuotesGenerator } from "@/components/QuotesGenerator";
import { MobileNav } from "@/components/MobileNav";
import { RefreshCw } from "lucide-react";

export default function QuotesPage() {


    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-indigo-500/30">
            <LeftSidebar />

            <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-0">
                {/* Top Header */}
                <div className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex flex-row items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-semibold text-white tracking-tight">Quotes Studio</h1>
                            <p className="hidden xs:block text-[10px] md:text-sm text-zinc-400">AI Video Creation Engine</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors border border-transparent hover:border-white/10">
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                                    <span className="text-white font-medium text-xs md:text-sm">J</span>
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
