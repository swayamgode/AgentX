"use client";

import { useState, useEffect } from "react";
import { Youtube, Instagram, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useSocialConnection } from "@/hooks/useSocialConnection";
import { useRouter } from "next/navigation";

export function SocialMediaConnect() {
    const { status, loading, refresh } = useSocialConnection();
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Refresh status when component mounts to ensure we catch any redirect results
    useEffect(() => {
        refresh();
    }, [refresh]);

    const handleConnect = (platform: 'youtube' | 'instagram') => {
        // Redirect to OAuth flow
        // We use window.location because we're leaving the app
        window.location.href = `/api/${platform}/auth`;
    };

    const handleDisconnect = async (platform: 'youtube' | 'instagram') => {
        // Call an endpoint to clear tokens (we need to implement this endpoint if it doesn't exist)
        // For now, assume a simple fetch to clear it, or we can just ignore it client side, 
        // but server side cleanup is better. 
        // Let's create a disconnect endpoint later, for now we will just manually set local state 
        // or re-fetch. Since we don't have a specific disconnect API yet, we might fallback
        // to clearing cookies if that was the old way, but we moved to file storage.
        // We should create a DELETE /api/social/connection endpoint. 

        try {
            await fetch(`/api/social/disconnect?platform=${platform}`, { method: 'POST' });
            refresh();
        } catch (e) {
            console.error("Disconnect failed", e);
        }
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await refresh();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    if (loading) {
        return <div className="p-4 text-[#71767b]">Loading connections...</div>;
    }

    const accounts = [
        {
            platform: 'youtube',
            connected: status.youtube.connected,
            username: status.youtube.username
        },
        {
            platform: 'instagram',
            connected: status.instagram.connected,
            username: status.instagram.username
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ExternalLink size={20} className="text-purple-500" />
                    Social Media Connections
                </h3>
                <button
                    onClick={handleManualRefresh}
                    className={`text-[#71767b] hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh connections"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="space-y-3">
                {accounts.map((account) => (
                    <div
                        key={account.platform}
                        className="bg-[#16181c] border border-[#333] rounded-xl p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            {account.platform === 'youtube' ? (
                                <Youtube className="text-red-500" size={24} />
                            ) : (
                                <Instagram className="text-pink-500" size={24} />
                            )}
                            <div>
                                <p className="font-bold text-white capitalize">{account.platform}</p>
                                {account.connected ? (
                                    <p className="text-sm text-green-500">Connected</p>
                                ) : (
                                    <p className="text-sm text-[#71767b]">Not connected</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {account.connected ? (
                                <>
                                    <CheckCircle className="text-green-500" size={20} />
                                    <button
                                        onClick={() => handleDisconnect(account.platform as 'youtube' | 'instagram')}
                                        className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleConnect(account.platform as 'youtube' | 'instagram')}
                                    className="px-4 py-2 bg-white hover:bg-[#e5e5e5] text-black rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Connect
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[#16181c] border border-[#333] rounded-xl p-4">
                <div className="flex items-start gap-2">
                    <AlertCircle className="text-yellow-500 mt-0.5" size={18} />
                    <div className="text-sm text-[#71767b]">
                        <p className="font-semibold text-white mb-1">Important Notes:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>YouTube requires a Google account with an active channel</li>
                            <li>Instagram requires a Business or Creator account linked to a Facebook Page</li>
                            <li>Videos will be posted as public by default (can be changed)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
