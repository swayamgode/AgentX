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
        <div className="flex flex-col h-[calc(100vh-2.5rem)] sticky top-5 w-16 bg-black border border-white/10 overflow-y-auto hidden md:flex shrink-0 rounded-2xl m-5 mr-0 shadow-xl transition-all">
            {/* Logo */}
            <div className="p-3 my-2 flex justify-center">
                <Link href="/" className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black font-black text-xl tracking-tighter">A.</span>
                    </div>
                </Link>
            </div>

            {/* Nav Items - Icon Only */}
            <nav className="flex-1 flex flex-col items-center gap-6 mb-6 mt-8">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="group relative flex items-center"
                            title={item.label}
                        >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${isActive
                                ? "bg-white text-black shadow-md"
                                : "text-white/40 hover:text-white"
                                }`}>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            {/* Simple Tooltip */}
                            <div className="absolute left-full ml-4 px-2 py-1 bg-black border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-all z-50">
                                {item.label}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Settings at Bottom */}
            <div className="mt-auto mb-6 flex justify-center">
                <Link href="/settings" className="w-10 h-10 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-all">
                    <Settings size={20} />
                </Link>
            </div>
        </div>
    );
}

