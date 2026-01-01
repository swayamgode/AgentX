"use client";

import { Search, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export function RightSidebar() {
    const [usage, setUsage] = useState({ used: 0, limit: 1500 });

    useEffect(() => {
        fetch("/api/tweets").then(r => r.json()).then(data => {
            if (data.usage) setUsage(data.usage);
        }).catch(e => console.error(e));
    }, []);

    return (
        <div className="hidden lg:flex flex-col w-[350px] pl-8 h-screen pt-1 overflow-y-auto sticky top-0 border-l border-[#333]">
            {/* Search Bar */}
            <div className="sticky top-0 bg-black pt-2 pb-3 z-10 opacity-95">
                <div className="group relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71767b] group-focus-within:text-white">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-[#16181c] text-[#e7e9ea] rounded-xl py-2.5 pl-12 pr-4 focus:bg-black focus:border focus:border-white border border-transparent outline-none transition-all placeholder-[#71767b]"
                    />
                </div>
            </div>

            {/* Usage Card (Clean) */}
            <div className="bg-[#16181c] rounded-2xl flex flex-col mb-4 border border-[#333]">
                <h2 className="font-extrabold text-xl px-4 py-3 text-[#e7e9ea]">AI Limits</h2>
                <div className="px-4 pb-4">
                    <div className="flex justify-between text-sm mb-2 text-[#71767b]">
                        <span className="flex items-center gap-1"><Zap size={14} className="text-white" /> Tokens Used</span>
                        <span className="font-mono text-white">{usage.used} / {usage.limit}</span>
                    </div>
                    <div className="w-full bg-[#333] rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-white h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                            style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-[#71767b] mt-3 leading-relaxed">
                        Reset in <span className="text-[#e7e9ea]">24h</span>. Upgrade for Pro.
                    </p>
                </div>
            </div>

            {/* Recommended (Clean) */}
            <div className="bg-[#16181c] rounded-2xl flex flex-col mb-4 border border-[#333]">
                <h2 className="font-extrabold text-xl px-4 py-3 text-[#e7e9ea]">Recommended</h2>

                {[1, 2].map((i) => (
                    <div key={i} className="px-4 py-3 hover:bg-[#1e2024] cursor-pointer transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#333]"></div>
                            <div className="flex flex-col">
                                <span className="font-bold text-[#e7e9ea] text-[15px] group-hover:underline">Elon Musk</span>
                                <span className="text-[#71767b] text-[15px]">@elonmusk</span>
                            </div>
                        </div>
                        <button className="bg-white text-black font-bold text-sm px-4 py-1.5 rounded-lg hover:bg-[#e5e5e5] transition-colors">
                            Follow
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
