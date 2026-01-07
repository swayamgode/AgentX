"use client";

import { LeftSidebar } from "@/components/LeftSidebar";
import { UnifiedMemeWorkflow } from "@/components/UnifiedMemeWorkflow";
import { Sparkles } from "lucide-react";

export default function MemePage() {
    return (
        <div className="flex min-h-screen bg-black text-[#e7e9ea]">
            <LeftSidebar />

            <main className="flex-1 border-x border-[#333] min-h-screen flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#333]">
                    <div className="p-4">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="text-purple-500" /> Meme Studio
                        </h1>
                        <p className="text-sm text-[#71767b] mt-1">
                            Generate memes with AI → Convert to videos → Schedule to YouTube
                        </p>
                    </div>
                </div>

                {/* Unified Workflow */}
                <div className="p-6">
                    <UnifiedMemeWorkflow />
                </div>
            </main>
        </div>
    );
}
