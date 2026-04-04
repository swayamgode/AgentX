"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, Repeat, PlaySquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";

interface Video {
    id: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    viewCount: string;
    likeCount: string;
}

interface AccountInfo {
    id: string;
    channelName: string;
    channelId: string;
}

export default function RepostPage() {
    const [topic, setTopic] = useState("#shorts comedy");
    const [videos, setVideos] = useState<Video[]>([]);
    const [accounts, setAccounts] = useState<AccountInfo[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<string>("");
    
    const [isSearching, setIsSearching] = useState(false);
    const [repostingId, setRepostingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        // Fetch connected accounts
        const fetchAccounts = async () => {
            try {
                const res = await fetch('/api/youtube/status');
                if (res.ok) {
                    const data = await res.json();
                    if (data.accounts) {
                        setAccounts(data.accounts);
                        if (data.accounts.length > 0) {
                            setSelectedAccount(data.accounts[0].id);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load accounts", err);
            }
        };
        fetchAccounts();
    }, []);

    const searchTrending = async () => {
        setIsSearching(true);
        setError(null);
        try {
            const res = await fetch(`/api/repost/search?q=${encodeURIComponent(topic)}`);
            const data = await res.json();
            if (res.ok) {
                setVideos(data.videos || []);
            } else {
                setError(data.error || 'Failed to fetch trending videos');
            }
        } catch (err) {
            setError('An error occurred while searching');
        } finally {
            setIsSearching(false);
        }
    };

    const handleRepost = async (video: Video) => {
        if (!selectedAccount) {
            setError("Please select a target channel first.");
            return;
        }

        setRepostingId(video.id);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch('/api/repost/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceVideoId: video.id,
                    targetAccountId: selectedAccount,
                    newTitle: video.title
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMessage(`Successfully reposted to selected channel! (Private upload)`);
            } else {
                setError(data.error || 'Failed to repost video');
            }
        } catch (err) {
            setError('An error occurred while reposting');
        } finally {
            setRepostingId(null);
        }
    };

    const formatNumber = (numStr: string) => {
        const num = parseInt(numStr);
        if (isNaN(num)) return "0";
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    return (
        <div className="flex h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-[#8B5CF6] selection:text-white overflow-hidden">
            <LeftSidebar />

            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <div className="max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8 pb-24 md:pb-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black mb-2 flex items-center gap-3">
                                TREND REPOST <Repeat className="w-8 h-8 text-[#8B5CF6]" />
                            </h1>
                            <p className="text-[#86868b] text-lg font-medium max-w-2xl">
                                Hijack trending Shorts and auto-repost them to your channels to maximize reach.
                            </p>
                        </div>
                        <div className="flex bg-white px-4 py-2 rounded-2xl border border-[#e5e5e7] hover:border-[#8B5CF6] transition-all shadow-sm">
                            <select
                                className="bg-transparent border-none outline-none font-bold text-black"
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                            >
                                <option value="" disabled>Select Target Channel...</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.channelName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 flex items-center gap-3 font-medium">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 flex items-center gap-3 font-medium">
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                            <p>{successMessage}</p>
                        </div>
                    )}

                    {/* Search Section */}
                    <div className="bg-white p-6 rounded-3xl border border-[#e5e5e7] shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
                            <input
                                type="text"
                                className="w-full bg-[#f5f5f7] border-2 border-transparent hover:border-[#e5e5e7] focus:border-[#8B5CF6] focus:bg-white rounded-2xl py-4 pl-12 pr-4 text-black font-semibold placeholder:text-[#86868b] outline-none transition-all"
                                placeholder="Search trending topic (e.g. #shorts comedy)"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && searchTrending()}
                            />
                        </div>
                        <button
                            onClick={searchTrending}
                            disabled={isSearching || !selectedAccount}
                            className={`w-full md:w-auto px-8 py-4 bg-black text-white rounded-2xl font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${isSearching || !selectedAccount ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1d1d1f] hover:scale-[1.02] active:scale-[0.98]'}`}
                        >
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            FIND TRENDS
                        </button>
                    </div>

                    {/* Results Grid */}
                    {videos.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {videos.map((video) => (
                                <div key={video.id} className="bg-white rounded-3xl border border-[#e5e5e7] overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1 duration-300">
                                    <div className="aspect-[9/16] relative bg-black overflow-hidden">
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                                            <div className="flex items-center gap-2 text-white/90 font-medium text-xs mb-1 uppercase tracking-wider">
                                                <PlaySquare className="w-4 h-4 text-[#8B5CF6]" />
                                                {formatNumber(video.viewCount)} views
                                            </div>
                                            <h3 className="text-white font-bold leading-snug line-clamp-2 drop-shadow-md">
                                                {video.title}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col gap-4">
                                        <div className="text-sm text-[#86868b] font-medium truncate">
                                            By {video.channelTitle}
                                        </div>
                                        <button
                                            onClick={() => handleRepost(video)}
                                            disabled={repostingId === video.id || !selectedAccount}
                                            className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                                repostingId === video.id
                                                    ? 'bg-[#f5f5f7] text-[#86868b] cursor-wait'
                                                    : 'bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white'
                                            }`}
                                        >
                                            {repostingId === video.id ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> REPOSTING...</>
                                            ) : (
                                                <><Repeat className="w-4 h-4" /> REPOST</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <MobileNav />
        </div>
    );
}
