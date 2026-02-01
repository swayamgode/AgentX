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
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-white/10 z-50 md:hidden pb-safe">
            <div className="flex justify-around items-center p-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? "text-white" : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-white/10" : ""
                                }`}>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
            {/* Safe area padding for iPhones with home indicator */}
            <div className="h-safe-bottom w-full bg-black/90" />
        </div>
    );
}
