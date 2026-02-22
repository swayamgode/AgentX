"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, MoreHorizontal, Smile, Calendar, Sparkles, BarChart3, Rocket } from "lucide-react";

export function LeftSidebar() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: "Twitter Agent", href: "/" },
        { icon: Sparkles, label: "Quotes", href: "/quotes" },
        { icon: Smile, label: "Meme Studio", href: "/memes" },
        { icon: Rocket, label: "Auto-Pilot", href: "/autopilot" },
        { icon: BarChart3, label: "Analytics", href: "/analytics" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] sticky top-4 w-[100px] bg-black/80 backdrop-blur-xl border border-white/10 overflow-y-auto hidden md:flex shrink-0 rounded-3xl m-4 mr-0 shadow-2xl">
            {/* Logo */}
            <div className="p-4 my-2 flex justify-center">
                <Link href="/" className="flex items-center justify-center group">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <span className="text-black font-bold text-xl">F.</span>
                    </div>
                </Link>
            </div>

            {/* Nav Items - Icon Only */}
            <nav className="flex-1 flex flex-col items-center gap-6 mb-4 mt-8">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="group relative flex items-center"
                            title={item.label}
                        >
                            {/* Active Indicator Line */}
                            {isActive && (
                                <div className="absolute -left-4 w-1 h-6 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                            )}

                            <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${isActive
                                ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-110"
                                : "hover:bg-white/10 text-white/60 hover:text-white"
                                }`}>
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            {/* Tooltip */}
                            <div className="absolute left-full ml-4 px-3 py-2 bg-black/90 border border-white/10 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all translate-x-[-10px] group-hover:translate-x-0 z-50">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Settings Icon at Bottom */}
            <div className="mt-auto mb-6 flex justify-center">
                <Link href="/settings" className="w-12 h-12 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                    <Settings size={22} />
                </Link>
            </div>
        </div>
    );
}
