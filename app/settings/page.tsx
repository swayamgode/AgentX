"use client";

import { useState, useEffect } from "react";
import { Key, Save, Check, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LeftSidebar } from "@/components/LeftSidebar";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { YouTubeAccountManager } from "@/components/YouTubeAccountManager";
import { MobileNav } from "@/components/MobileNav";

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
        <div className="flex min-h-screen bg-[#F8F9FA]">
            <LeftSidebar />

            <main className="flex-1 pb-20 md:pb-12">
                <div className="max-w-[1200px] mx-auto space-y-12">
                    {/* Header */}
                    <div className="sticky top-5 mx-8 rounded-[2rem] glass-effect z-40 border-white/20 shadow-lg px-8 py-8 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Link href="/" className="w-12 h-12 flex items-center justify-center bg-white border border-[#E9ECEF] rounded-2xl text-[#6C757D] hover:text-[#1A1A1E] hover:border-[#8B5CF6] transition-all shadow-sm">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-black text-[#1A1A1E] tracking-tight">System Settings</h1>
                                <p className="text-sm font-medium text-[#6C757D] mt-1">Configure your AI workspace and integrations</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-100">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-700">Account Active</span>
                        </div>
                    </div>

                    <div className="px-8 grid grid-cols-1 gap-10">
                        {/* API Configuration */}
                        <section className="space-y-6">
                            <h2 className="text-xl font-black text-[#1A1A1E] tracking-tight ml-2">General Configuration</h2>
                            <div className="bg-white border border-[#E9ECEF] rounded-[2.5rem] p-8 md:p-10 shadow-sm premium-card">
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="p-4 bg-[#f5f5f7] rounded-2xl hidden md:block">
                                        <Key size={32} className="text-[#1d1d1f]" />
                                    </div>
                                    <div className="flex-1 space-y-6 w-full">
                                        <div>
                                            <h3 className="font-bold text-lg text-[#1d1d1f]">Gemini API Key</h3>
                                            <p className="text-[#86868b] text-sm mt-1">
                                                Required for all AI generation features. Get yours from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-black underline underline-offset-2 hover:opacity-70">Google AI Studio</a>.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            {isConfigured && (
                                                <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-xl border border-green-100 w-fit">
                                                    <Check size={18} strokeWidth={2.5} />
                                                    <span className="font-medium">Active: <span className="font-mono">{maskedKey}</span></span>
                                                </div>
                                            )}

                                            <div className="flex flex-col md:flex-row gap-4">
                                                <input
                                                    type="password"
                                                    value={apiKey}
                                                    onChange={(e) => setApiKey(e.target.value)}
                                                    placeholder={isConfigured ? "Enter new key to update" : "Paste your API Key here"}
                                                    className="flex-1 bg-[#F8F9FA] border border-[#E9ECEF] rounded-2xl px-6 py-4 text-[#1A1A1E] focus:ring-4 focus:ring-purple-100 focus:border-[#8B5CF6] outline-none transition-all placeholder-[#6C757D] font-mono text-sm"
                                                />
                                                <button
                                                    onClick={handleSave}
                                                    disabled={loading || !apiKey.trim()}
                                                    className="bg-black hover:bg-[#1A1A1E] text-white font-black px-8 py-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
                                                >
                                                    {loading ? "Saving..." : "Save Config"}
                                                </button>
                                            </div>

                                            {message && (
                                                <div className={`text-sm flex items-center gap-2 font-medium ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {message.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                                                    {message.text}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Social Media Connections */}
                            <section className="space-y-4">
                                <h2 className="text-lg md:text-xl font-semibold text-[#1d1d1f]">Social Integrations</h2>
                                <div className="bg-white border border-[#e5e5e7] rounded-2xl p-4 md:p-6 shadow-sm h-full">
                                    <SocialMediaConnect />
                                </div>
                            </section>

                            {/* YouTube Manager */}
                            <section className="space-y-4">
                                <h2 className="text-lg md:text-xl font-semibold text-[#1d1d1f]">Channel Management</h2>
                                <div className="bg-white border border-[#e5e5e7] rounded-2xl p-4 md:p-6 shadow-sm h-full">
                                    <YouTubeAccountManager />
                                </div>
                            </section>
                        </div>

                        <div className="text-center py-8 text-[#86868b] text-sm">
                            <p>AgentX v1.0.0 • <Link href="#" className="hover:underline">Privacy Policy</Link> • <Link href="#" className="hover:underline">Terms of Service</Link></p>
                        </div>
                    </div>
                </div>
            </main>
            <MobileNav />
        </div>
    );
}
