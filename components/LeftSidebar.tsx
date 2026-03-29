"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, MoreHorizontal, Smile, Calendar, Sparkles, BarChart3, Rocket } from "lucide-react";

export function LeftSidebar() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: "Dashboard", href: "/dashboard" },
        { icon: Sparkles, label: "Quotes", href: "/quotes" },
        { icon: Smile, label: "Meme Studio", href: "/memes" },
        { icon: Rocket, label: "Auto-Pilot", href: "/autopilot" },
        { icon: BarChart3, label: "Analytics", href: "/analytics" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-2.5rem)] sticky top-5 w-[100px] bg-[#0D1117]/95 backdrop-blur-2xl border border-white/5 overflow-y-auto hidden md:flex shrink-0 rounded-[2.5rem] m-5 mr-0 shadow-2xl transition-all duration-500">
            {/* Logo */}
            <div className="p-6 my-4 flex justify-center">
                <Link href="/" className="flex items-center justify-center group">
                    <div className="w-14 h-14 bg-gradient-to-br from-white to-gray-200 rounded-2xl flex items-center justify-center hover:rotate-6 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        <span className="text-black font-black text-2xl tracking-tighter">A.</span>
                    </div>
                </Link>
            </div>

            {/* Nav Items - Icon Only */}
            <nav className="flex-1 flex flex-col items-center gap-8 mb-6 mt-10">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="group relative flex items-center"
                            title={item.label}
                        >
                            {/* Active Indicator Pulse */}
                            {isActive && (
                                <div className="absolute -left-6 w-2 h-8 bg-[#8B5CF6] rounded-r-full shadow-[0_0_20px_rgba(139,92,246,0.6)] animate-pulse" />
                            )}

                            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-400 ${isActive
                                ? "bg-white text-black shadow-[0_10px_20px_rgba(255,255,255,0.1)] scale-110"
                                : "hover:bg-white/5 text-white/40 hover:text-white hover:scale-105"
                                }`}>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            {/* Enhanced Tooltip */}
                            <div className="absolute left-full ml-6 px-4 py-2 bg-black/90 border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all duration-300 translate-x-[-15px] group-hover:translate-x-0 z-50 backdrop-blur-md">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Settings Icon at Bottom */}
            <div className="mt-auto mb-8 flex justify-center">
                <Link href="/settings" className="w-14 h-14 rounded-2xl hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all duration-300 group">
                    <Settings size={24} className="group-hover:rotate-90 transition-transform duration-500" />
                </Link>
            </div>
        </div>
    );
}

