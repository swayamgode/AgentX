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
                <h3 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
                    <ExternalLink size={20} className="text-purple-600" />
                    Social Media Connections
                </h3>
                <button
                    onClick={handleManualRefresh}
                    className={`text-[#86868b] hover:text-[#1d1d1f] transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                    title="Refresh connections"
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            <div className="space-y-3">
                {accounts.map((account) => (
                    <div
                        key={account.platform}
                        className="bg-[#f5f5f7] rounded-xl p-4 flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            {account.platform === 'youtube' ? (
                                <Youtube className="text-red-600" size={24} />
                            ) : (
                                <Instagram className="text-pink-600" size={24} />
                            )}
                            <div>
                                <p className="font-bold text-[#1d1d1f] capitalize">{account.platform}</p>
                                {account.connected ? (
                                    <p className="text-sm text-green-600">Connected</p>
                                ) : (
                                    <p className="text-sm text-[#86868b]">Not connected</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {account.connected ? (
                                <>
                                    <CheckCircle className="text-green-600" size={20} />
                                    <button
                                        onClick={() => handleDisconnect(account.platform as 'youtube' | 'instagram')}
                                        className="px-4 py-2 bg-white hover:bg-[#e5e5e7] border border-[#e5e5e7] text-[#1d1d1f] rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleConnect(account.platform as 'youtube' | 'instagram')}
                                    className="px-4 py-2 bg-black hover:bg-[#333] text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Connect
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[#f5f5f7] border border-transparent rounded-xl p-4">
                <div className="flex items-start gap-2">
                    <AlertCircle className="text-yellow-600 mt-0.5" size={18} />
                    <div className="text-sm text-[#86868b]">
                        <p className="font-semibold text-[#1d1d1f] mb-1">Important Notes:</p>
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
