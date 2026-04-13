"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { QuotesGenerator } from "@/components/QuotesGenerator";
import { MobileNav } from "@/components/MobileNav";
import { RefreshCw } from "lucide-react";

export default function QuotesPage() {


    return (
        <div className="flex min-h-screen bg-[#F5F5F7]">
            <LeftSidebar />

            <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-0">
                {/* Top Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-[#e5e5e7]">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-2 md:py-4 flex flex-row items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg md:text-2xl font-bold text-[#1d1d1f] tracking-tight">Quotes Studio</h1>
                            <p className="hidden xs:block text-[10px] md:text-sm text-[#86868b]">AI Video Creation Engine</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 cursor-pointer hover:bg-[#f5f5f7] px-2 py-1.5 rounded-lg transition-colors border border-transparent hover:border-[#e5e5e7]">
                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-[#000] to-[#333] flex items-center justify-center shadow-lg">
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
