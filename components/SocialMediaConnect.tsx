"use client";

import { useState, useEffect } from "react";
import { Youtube, Instagram, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

interface SocialMediaAccount {
    platform: 'youtube' | 'instagram';
    connected: boolean;
    username?: string;
}

export function SocialMediaConnect() {
    const [accounts, setAccounts] = useState<SocialMediaAccount[]>([
        { platform: 'youtube', connected: false },
        { platform: 'instagram', connected: false },
    ]);

    useEffect(() => {
        // Check for connection status from URL params (after OAuth redirect)
        const params = new URLSearchParams(window.location.search);

        if (params.get('youtube_connected') === 'true') {
            const username = params.get('youtube_name');
            setAccounts(prev => prev.map(acc =>
                acc.platform === 'youtube'
                    ? { ...acc, connected: true, username: username || undefined }
                    : acc
            ));
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }

        if (params.get('instagram_connected') === 'true') {
            const username = params.get('instagram_username');
            setAccounts(prev => prev.map(acc =>
                acc.platform === 'instagram'
                    ? { ...acc, connected: true, username: username || undefined }
                    : acc
            ));
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    const handleConnect = (platform: 'youtube' | 'instagram') => {
        // Redirect to OAuth flow
        window.location.href = `/api/${platform}/auth`;
    };

    const handleDisconnect = (platform: 'youtube' | 'instagram') => {
        // Clear cookies and update state
        document.cookie = `${platform}_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        setAccounts(prev => prev.map(acc =>
            acc.platform === platform
                ? { ...acc, connected: false, username: undefined }
                : acc
        ));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ExternalLink size={20} className="text-purple-500" />
                Social Media Connections
            </h3>

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
                                {account.connected && account.username ? (
                                    <p className="text-sm text-[#71767b]">@{account.username}</p>
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
                                        onClick={() => handleDisconnect(account.platform)}
                                        className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleConnect(account.platform)}
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
