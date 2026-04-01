"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, Sparkles, Smile, BarChart3, Rocket } from "lucide-react";

export function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: "Home", href: "/" },
        { icon: Sparkles, label: "Quotes", href: "/quotes" },
        { icon: Smile, label: "Memes", href: "/memes" },
        { icon: Rocket, label: "Auto-Pilot", href: "/autopilot" },
        { icon: BarChart3, label: "Analytics", href: "/analytics" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    return (
        <div className="fixed bottom-4 left-4 right-4 bg-black border border-white/20 z-50 md:hidden rounded-2xl shadow-xl overflow-hidden">
            <div className="flex justify-around items-center p-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 p-2 transition-all ${isActive ? "text-white" : "text-white/40"}`}
                        >
                            <div className={`p-1.5 rounded-lg transition-all ${isActive ? "bg-white/20" : ""}`}>
                                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[8px] font-bold uppercase tracking-wider ${isActive ? "opacity-100" : "opacity-0 h-0 w-0 overflow-hidden"}`}>{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
