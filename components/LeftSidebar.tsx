"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, MoreHorizontal, Smile, Calendar, Sparkles, BarChart3 } from "lucide-react";

export function LeftSidebar() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: "Twitter Agent", href: "/" },
        { icon: Sparkles, label: "Quotes", href: "/quotes" },
        { icon: Smile, label: "Meme Studio", href: "/memes" },
        { icon: BarChart3, label: "Analytics", href: "/analytics" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-2rem)] sticky top-4 w-[100px] lg:w-[100px] bg-[#000000] overflow-y-auto hidden md:flex shrink-0 rounded-3xl m-4 mr-0">
            {/* Logo */}
            <div className="p-4 my-2 flex justify-center">
                <Link href="/" className="flex items-center justify-center group">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center hover:scale-105 transition-transform">
                        <span className="text-black font-bold text-xl">F.</span>
                    </div>
                </Link>
            </div>

            {/* Nav Items - Icon Only */}
            <nav className="flex-1 flex flex-col items-center gap-4 mb-4 mt-8">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="group relative"
                            title={item.label}
                        >
                            <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all ${isActive
                                ? "bg-white text-black"
                                : "hover:bg-[#1a1a1a] text-white"
                                }`}>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            {/* Tooltip */}
                            <div className="absolute left-full ml-4 px-3 py-2 bg-[#1a1a1a] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                                {item.label}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Settings Icon at Bottom */}
            <div className="mt-auto mb-6 flex justify-center">
                <button className="w-12 h-12 rounded-xl hover:bg-[#1a1a1a] flex items-center justify-center text-white transition-colors">
                    <Settings size={24} />
                </button>
            </div>
        </div>
    );
}
