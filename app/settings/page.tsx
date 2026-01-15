"use client";

import { useState, useEffect } from "react";
import { Key, Save, Check, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LeftSidebar } from "@/components/LeftSidebar";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { YouTubeAccountManager } from "@/components/YouTubeAccountManager";

export default function SettingsPage() {
    const [apiKey, setApiKey] = useState("");
    const [maskedKey, setMaskedKey] = useState("");
    const [isConfigured, setIsConfigured] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetchApiKeyStatus();

        // Check for URL parameters for notifications
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const error = params.get('error');

        if (success === 'youtube_connected') {
            setMessage({ type: 'success', text: 'YouTube account connected successfully!' });
            // Clear URL params
            window.history.replaceState({}, '', '/settings');
        } else if (error) {
            const errorMap: Record<string, string> = {
                'youtube_auth_denied': 'YouTube authentication was denied.',
                'no_code': 'No authentication code received.',
                'no_channel': 'No YouTube channel found on this account.',
                'auth_failed': 'Failed to connect YouTube account.',
            };
            setMessage({ type: 'error', text: errorMap[error] || 'An unknown error occurred.' });
            window.history.replaceState({}, '', '/settings');
        }
    }, []);

    const fetchApiKeyStatus = async () => {
        try {
            const res = await fetch("/api/settings/api-key");
            const data = await res.json();
            if (data.configured) {
                setIsConfigured(true);
                setMaskedKey(data.maskedKey);
            }
        } catch (error) {
            console.error("Error fetching API key status:", error);
        }
    };

    const handleSave = async () => {
        if (!apiKey.trim()) {
            setMessage({ type: "error", text: "Please enter an API key" });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const res = await fetch("/api/settings/api-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: "API key saved successfully!" });
                setIsConfigured(true);
                setMaskedKey(data.maskedKey);
                setApiKey("");
            } else {
                setMessage({ type: "error", text: data.error || "Failed to save API key" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save API key" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-[#e7e9ea] flex justify-center">

            <LeftSidebar />

            <main className="flex flex-col w-full max-w-[600px] ml-[275px] border-l border-r border-[#333] min-h-screen">
                {/* Header */}
                <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#333] px-4 py-3 flex items-center gap-4">
                    <Link href="/" className="p-2 -ml-2 hover:bg-[#181818] rounded-full transition-colors">
                        <ArrowLeft size={20} className="text-white" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-white">Settings</h2>
                        <p className="text-xs text-[#71767b]">@agentx_ai</p>
                    </div>
                </div>

                <div className="p-4 space-y-6">

                    {/* API Key Card */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-xl px-2 text-white">API Configuration</h3>

                        <div className="bg-black border border-[#333] rounded-2xl overflow-hidden hover:bg-[#080808] transition-colors relative group">
                            <div className="p-4 flex gap-4">
                                <div className="p-3 bg-[#333]/50 rounded-xl h-max">
                                    <Key size={24} className="text-white" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h4 className="font-bold text-lg text-white">Gemini API Key</h4>
                                        <p className="text-[#a1a1aa] text-sm leading-relaxed">
                                            Required for all AI generation features.
                                            Get yours from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-white underline hover:no-underline">Google AI Studio</a>.
                                        </p>
                                    </div>

                                    {/* Status Indicator */}
                                    {isConfigured && (
                                        <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg w-max text-sm font-bold">
                                            <Check size={16} strokeWidth={3} />
                                            <span>Active: {maskedKey}</span>
                                        </div>
                                    )}

                                    {/* Input Area */}
                                    <div className="relative group/input">
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder={isConfigured ? "Enter new key to update" : "Paste API Key here"}
                                            className="w-full bg-black border border-[#333] rounded-xl px-4 py-3 text-[#e7e9ea] focus:border-white focus:ring-1 focus:ring-white outline-none transition-all placeholder-[#52525b]"
                                        />
                                    </div>

                                    {message && (
                                        <div className={`text-sm flex items-center gap-2 font-bold ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                                            {message.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={handleSave}
                                            disabled={loading || !apiKey.trim()}
                                            className="bg-white hover:bg-[#e5e5e5] text-black font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {loading ? "Saving..." : "Save Key"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social Media Connections */}
                    <div className="space-y-4">
                        <div className="bg-black border border-[#333] rounded-2xl overflow-hidden p-6">
                            <SocialMediaConnect />
                        </div>
                    </div>

                    {/* YouTube Account Manager */}
                    <div className="space-y-4">
                        <div className="bg-black border border-[#333] rounded-2xl overflow-hidden p-6">
                            <YouTubeAccountManager />
                        </div>
                    </div>

                    <div className="px-2 text-[#71767b] text-sm">
                        <p>More settings coming soon.</p>
                    </div>

                </div>
            </main>
        </div>
    );
}
