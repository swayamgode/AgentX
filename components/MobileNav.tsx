"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, Sparkles, Smile, Rocket, Repeat, BarChart3 } from "lucide-react";

export function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: "Home", href: "/dashboard" },
        { icon: Sparkles, label: "Quotes", href: "/quotes" },
        { icon: Rocket, label: "Pilot", href: "/autopilot" },
        { icon: BarChart3, label: "Stats", href: "/analytics" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-black/80 backdrop-blur-2xl border border-white/20 z-50 md:hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="flex justify-around items-center p-1.5 px-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center justify-center py-2 transition-all ${isActive ? "text-white" : "text-white/40 hover:text-white/60"}`}
                        >
                            <div className={`p-2 rounded-2xl transition-all duration-300 ${isActive ? "bg-white/10 scale-110 shadow-lg" : "hover:bg-white/5"}`}>
                                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[7px] font-black uppercase tracking-[0.15em] mt-1 transition-all ${isActive ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
