'use client';

import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import BulkScheduler from "@/components/BulkScheduler";
import { Rocket, Calendar, TrendingUp, Zap } from "lucide-react";

export default function AutomatePage() {
    return (
        <div className="flex min-h-screen bg-white/5">
            <LeftSidebar />

            <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-8">
                {/* Top Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-white/10">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                                <Rocket className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-zinc-100">
                                    Automated Posting
                                </h1>
                                <p className="text-xs md:text-sm text-zinc-400 mt-0.5">
                                    Schedule and upload content across all accounts
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6">
                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FeatureCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            title="Analytics-Based Timing"
                            description="Posts at peak engagement hours based on your data"
                            color="from-blue-500 to-cyan-500"
                        />
                        <FeatureCard
                            icon={<Calendar className="w-5 h-5" />}
                            title="Smart Scheduling"
                            description="Spreads content across days for maximum reach"
                            color="from-purple-500 to-pink-500"
                        />
                        <FeatureCard
                            icon={<Zap className="w-5 h-5" />}
                            title="Unique Content"
                            description="Generates different videos for each account"
                            color="from-orange-500 to-red-500"
                        />
                    </div>

                    {/* Bulk Scheduler Component */}
                    <BulkScheduler />

                    {/* Info Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-purple-900 mb-3">
                            📚 How to Use
                        </h3>
                        <ol className="space-y-2 text-sm text-purple-800">
                            <li className="flex gap-2">
                                <span className="font-bold">1.</span>
                                <span>Ensure you have connected at least one YouTube account in Settings</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold">2.</span>
                                <span>Edit <code className="bg-[#111]px-2 py-0.5 rounded">topics.txt</code> to customize content themes</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold">3.</span>
                                <span>Click "Start Automated Posting" to generate and schedule videos</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold">4.</span>
                                <span>Run <code className="bg-[#111]px-2 py-0.5 rounded">npm run scheduler</code> to enable automatic uploads</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold">5.</span>
                                <span>Videos will upload automatically at their scheduled times</span>
                            </li>
                        </ol>
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
        <div className="bg-[#111] border border-white/10 rounded-xl p-5 hover:shadow-lg transition-shadow">
            <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${color} text-white mb-3`}>
                {icon}
            </div>
            <h3 className="font-bold text-zinc-100 mb-1">{title}</h3>
            <p className="text-sm text-zinc-400">{description}</p>
        </div>
    );
}
