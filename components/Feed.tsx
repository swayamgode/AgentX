"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Repeat2, Heart, BarChart2, MoreHorizontal, Trash2, Edit2 } from "lucide-react";

interface Tweet {
    id: string;
    content: string;
    scheduledFor: string;
    status: string;
    createdAt: string;
}

export function Feed({ refreshTrigger }: { refreshTrigger: number }) {
    const [tweets, setTweets] = useState<Tweet[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTweets = async () => {
        try {
            const res = await fetch("/api/tweets");
            const data = await res.json();
            if (data.tweets) {
                setTweets(data.tweets);
            }
        } catch (error) {
            console.error("Failed to fetch tweets", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTweets();
    }, [refreshTrigger]);

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(fetchTweets, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this tweet?")) return;
        try {
            await fetch(`/api/tweets?id=${id}`, { method: "DELETE" });
            fetchTweets();
        } catch (error) {
            console.error("Delete error", error);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);

        if (diffHrs < 24) {
            return `${Math.floor(diffHrs)}h`;
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return <div className="p-8 text-center text-[#71767b]">Loading...</div>;
    }

    return (
        <div className="flex flex-col">
            {tweets.map((tweet) => (
                <article key={tweet.id} className="border-b border-[#2f3336] p-4 flex gap-3 hover:bg-[#080808] transition-colors cursor-pointer">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-slate-700"></div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1 text-[15px] leading-5">
                                <span className="font-bold text-[#e7e9ea]">AgentX User</span>
                                <span className="text-[#71767b]">@agentx_ai</span>
                                <span className="text-[#71767b]">·</span>
                                <span className="text-[#71767b] hover:underline">{formatDate(tweet.createdAt)}</span>
                            </div>
                            <div className="group relative">
                                <button className="text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 p-2 rounded-full -mr-2 transition-colors">
                                    <MoreHorizontal size={18} />
                                </button>
                                {/* Simple Dropdown for Delete/Edit could go here, for now just a delete button next to it if needed */}
                                <button
                                    onClick={(e) => handleDelete(tweet.id, e)}
                                    className="ml-2 text-[#71767b] hover:text-red-500"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Status Label if not Posted */}
                        {tweet.status !== 'POSTED' && (
                            <div className={`text-xs font-bold mb-1 ${tweet.status === 'SCHEDULED' ? 'text-[#1d9bf0]' : 'text-yellow-500'}`}>
                                {tweet.status === 'SCHEDULED' ? '📅 Scheduled' : '⏳ Draft'}
                            </div>
                        )}

                        <p className="text-[#e7e9ea] text-[15px] leading-normal whitespace-pre-wrap mb-3">
                            {tweet.content}
                        </p>

                        {/* Actions (Clean Monochrome) */}
                        <div className="flex justify-between max-w-[425px] text-[#71767b]">
                            <button className="group flex items-center gap-2 hover:text-white transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-white/10">
                                    <MessageCircle size={18} />
                                </div>
                            </button>
                            <button className="group flex items-center gap-2 hover:text-white transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-white/10">
                                    <Repeat2 size={18} />
                                </div>
                            </button>
                            <button className="group flex items-center gap-2 hover:text-white transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-white/10">
                                    <Heart size={18} />
                                </div>
                            </button>
                            <button className="group flex items-center gap-2 hover:text-white transition-colors">
                                <div className="p-2 rounded-full group-hover:bg-white/10">
                                    <BarChart2 size={18} />
                                </div>
                            </button>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
