"use client";

import { useState, useEffect } from "react";
import { Youtube, Trash2, Edit2, Check, X, Star } from "lucide-react";

interface YouTubeAccount {
    id: string;
    channelName: string;
    channelId: string;
    email: string;
    watermark: string;
    thumbnailUrl?: string;
    isActive: boolean;
    createdAt: string;
}

export function YouTubeAccountManager() {
    const [accounts, setAccounts] = useState<YouTubeAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editWatermark, setEditWatermark] = useState("");

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/youtube/accounts');
            const data = await res.json();
            setAccounts(data.accounts || []);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleSetActive = async (accountId: string) => {
        try {
            await fetch('/api/youtube/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'setActive', accountId })
            });
            fetchAccounts();
        } catch (error) {
            console.error('Failed to set active account:', error);
        }
    };

    const handleRemove = async (accountId: string) => {
        if (!confirm('Are you sure you want to remove this account?')) return;

        try {
            await fetch('/api/youtube/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove', accountId })
            });
            fetchAccounts();
        } catch (error) {
            console.error('Failed to remove account:', error);
        }
    };

    const handleStartEdit = (account: YouTubeAccount) => {
        setEditingId(account.id);
        setEditWatermark(account.watermark);
    };

    const handleSaveWatermark = async (accountId: string) => {
        try {
            await fetch('/api/youtube/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateWatermark',
                    accountId,
                    updates: { watermark: editWatermark }
                })
            });
            setEditingId(null);
            fetchAccounts();
        } catch (error) {
            console.error('Failed to update watermark:', error);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditWatermark("");
    };

    const handleAddAccount = () => {
        window.location.href = '/api/youtube/auth';
    };

    if (loading) {
        return <div className="text-[#71767b] text-sm">Loading accounts...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Youtube size={20} className="text-red-500" />
                        YouTube Accounts
                    </h3>
                    <p className="text-sm text-[#71767b] mt-1">
                        Manage multiple YouTube channels for content uploads
                    </p>
                </div>
                <button
                    onClick={handleAddAccount}
                    className="px-4 py-2 bg-white hover:bg-[#e5e5e5] text-black rounded-lg text-sm font-semibold transition-colors"
                >
                    + Add Account
                </button>
            </div>

            {accounts.length === 0 ? (
                <div className="bg-[#16181c] border border-[#333] rounded-xl p-8 text-center">
                    <Youtube className="mx-auto text-[#71767b] mb-3" size={48} />
                    <p className="text-white font-semibold mb-2">No YouTube accounts connected</p>
                    <p className="text-[#71767b] text-sm mb-4">
                        Connect your YouTube channel to start uploading videos
                    </p>
                    <button
                        onClick={handleAddAccount}
                        className="px-6 py-2.5 bg-white hover:bg-[#e5e5e5] text-black rounded-lg font-semibold transition-colors"
                    >
                        Connect YouTube
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className={`bg-[#16181c] border rounded-xl p-4 transition-all ${account.isActive
                                    ? 'border-red-500 bg-red-500/5'
                                    : 'border-[#333] hover:border-[#444]'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                {/* Channel Avatar */}
                                <div className="flex-shrink-0">
                                    {account.thumbnailUrl ? (
                                        <img
                                            src={account.thumbnailUrl}
                                            alt={account.channelName}
                                            className="w-12 h-12 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                                            <Youtube className="text-white" size={24} />
                                        </div>
                                    )}
                                </div>

                                {/* Account Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-white truncate">{account.channelName}</h4>
                                        {account.isActive && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                                                <Star size={12} fill="currentColor" />
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#71767b] mb-2">{account.email}</p>

                                    {/* Watermark */}
                                    <div className="mt-3">
                                        <label className="text-xs font-bold text-[#71767b] uppercase mb-1.5 block">
                                            Video Watermark
                                        </label>
                                        {editingId === account.id ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editWatermark}
                                                    onChange={(e) => setEditWatermark(e.target.value)}
                                                    className="flex-1 bg-black border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:border-red-500 outline-none"
                                                    placeholder="Enter watermark text"
                                                />
                                                <button
                                                    onClick={() => handleSaveWatermark(account.id)}
                                                    className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                                                    title="Save"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="p-2 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
                                                    title="Cancel"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-black border border-[#333] rounded-lg px-3 py-2">
                                                    <span className="text-white text-sm font-mono">
                                                        {account.watermark || '(No watermark)'}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleStartEdit(account)}
                                                    className="p-2 bg-[#333] hover:bg-[#444] text-white rounded-lg transition-colors"
                                                    title="Edit watermark"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2">
                                    {!account.isActive && (
                                        <button
                                            onClick={() => handleSetActive(account.id)}
                                            className="px-3 py-1.5 bg-[#333] hover:bg-[#444] text-white text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            Set Active
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleRemove(account.id)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                                        title="Remove account"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-[#16181c] border border-[#333] rounded-xl p-4">
                <p className="text-xs text-[#71767b]">
                    <strong className="text-white">Note:</strong> The active account will be used by default for all uploads.
                    You can select a different account when generating content.
                </p>
            </div>
        </div>
    );
}
