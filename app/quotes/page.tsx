"use client";

import { LeftSidebar } from "@/components/LeftSidebar";
import { QuotesGenerator } from "@/components/QuotesGenerator";

export default function QuotesPage() {
    return (
        <div className="flex justify-center min-h-screen bg-black text-[#e7e9ea]">
            <div className="flex w-full max-w-[1265px]">
                <LeftSidebar />

                <main className="flex-1 min-w-0 border-x border-[#333] min-h-screen flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 sticky top-0 bg-black/80 backdrop-blur-md p-4 z-40 border-b border-[#333]">
                        <h1 className="text-xl font-bold text-white">Quotes Studio</h1>
                    </div>

                    <div className="p-4">
                        <QuotesGenerator />
                    </div>
                </main>
            </div>
        </div>
    );
}
