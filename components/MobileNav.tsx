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
        <div className="fixed bottom-6 left-6 right-6 bg-[#0D1117]/90 backdrop-blur-2xl border border-white/10 z-50 md:hidden rounded-[2rem] shadow-2xl overflow-hidden pb-safe">
            <div className="flex justify-around items-center p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${isActive ? "text-white scale-110" : "text-white/40 hover:text-white/70"
                                }`}
                        >
                            <div className={`p-2.5 rounded-2xl transition-all ${isActive ? "bg-white/10 shadow-[inner_0_0_10px_rgba(255,255,255,0.05)]" : ""
                                }`}>
                                <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? "opacity-100" : "opacity-0"}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
