"use client";

import { LeftSidebar } from "@/components/LeftSidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { BulkMemeGenerator } from "@/components/BulkMemeGenerator";
import { Calendar, TrendingUp } from "lucide-react";

export default function SchedulePage() {
    return (
        <div className="flex justify-center min-h-screen bg-black text-[#e7e9ea]">
            <div className="flex w-full max-w-[1265px]">
                <LeftSidebar />

                <main className="flex-1 max-w-[600px] border-x border-[#333] min-h-screen">
                    {/* Header */}
                    <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#333] p-4">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Calendar className="text-purple-500" />
                            Automated Scheduling
                        </h1>
                        <p className="text-sm text-[#71767b] mt-1">
                            Generate and schedule memes in bulk for YouTube
                        </p>
                    </div>

                    <div className="p-4 space-y-8 pb-32">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-[#16181c] border border-[#333] rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="text-green-500" size={18} />
                                    <p className="text-xs font-bold text-[#71767b]">SCHEDULED</p>
                                </div>
                                <p className="text-2xl font-bold text-white">0</p>
                                <p className="text-xs text-[#71767b]">Pending posts</p>
                            </div>

                            <div className="bg-[#16181c] border border-[#333] rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="text-blue-500" size={18} />
                                    <p className="text-xs font-bold text-[#71767b]">POSTED</p>
                                </div>
                                <p className="text-2xl font-bold text-white">0</p>
                                <p className="text-xs text-[#71767b]">Total uploaded</p>
                            </div>

                            <div className="bg-[#16181c] border border-[#333] rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="text-purple-500" size={18} />
                                    <p className="text-xs font-bold text-[#71767b]">QUOTA</p>
                                </div>
                                <p className="text-2xl font-bold text-white">6/6</p>
                                <p className="text-xs text-[#71767b]">Videos/day</p>
                            </div>
                        </div>

                        <hr className="border-[#333]" />

                        {/* Bulk Generator */}
                        <BulkMemeGenerator />

                        <hr className="border-[#333]" />

                        {/* Upcoming Schedule */}
                        <div className="bg-[#16181c] border border-[#333] rounded-xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">Upcoming Schedule</h3>
                            <div className="text-center py-12 text-[#71767b]">
                                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No scheduled posts yet</p>
                                <p className="text-sm mt-1">Generate memes above to get started</p>
                            </div>
                        </div>
                    </div>
                </main>

                <RightSidebar />
            </div>
        </div>
    );
}
