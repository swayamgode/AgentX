"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, MoreHorizontal } from "lucide-react";

export function LeftSidebar() {
    const pathname = usePathname();

    const navItems = [
        { icon: Home, label: "Home", href: "/" },
        { icon: Settings, label: "Settings", href: "/settings" },
    ];

    return (
        <div className="flex flex-col h-screen sticky top-0 w-[275px] pl-2 pr-4 overflow-y-auto hidden md:flex shrink-0">
            {/* Logo: Simple Text "AgentX" or Monochrome Icon */}
            <div className="p-4 my-1">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                        <span className="text-black font-bold text-lg">A</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight">AgentX</span>
                </Link>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 space-y-2 mb-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href} className="block group">
                            <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${isActive ? "bg-white text-black" : "hover:bg-[#1a1a1a] text-[#a1a1aa]"}`}>
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-black" : "text-white"} />
                                <span className={`text-lg ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Generate Button (Clean Monochrome) */}
            <button className="bg-white hover:bg-[#e5e5e5] text-black font-bold text-base rounded-xl py-3 w-full shadow-lg transition-colors my-4">
                Generate
            </button>

            {/* User Profile (Clean) */}
            <div className="mt-auto mb-4 p-3 rounded-xl hover:bg-[#1a1a1a] flex items-center justify-between cursor-pointer transition-colors border border-transparent hover:border-[#333]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#333] flex items-center justify-center font-bold text-white text-sm">U</div>
                    <div className="flex flex-col leading-4">
                        <span className="font-bold text-white text-sm">User</span>
                        <span className="text-[#a1a1aa] text-xs">@agentx</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
