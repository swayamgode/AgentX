'use client';

import { useState, useRef, useEffect, useCallback } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import {
    Rocket, Terminal, Loader2, Settings as SettingsIcon, Zap, TrendingUp, Video, Clock,
    Plus, Trash2, Edit3, Check, X, ChevronDown, ChevronUp, Users, Palette, Tag, Play,
    Layers, RefreshCw
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Decoration {
    image: string;
    x: number;
    y: number;
    size: number;
}

interface Quote {
    text: string;
    author: string;
    category?: string;
    decorations?: Decoration[];
}

interface RenderConfig {
    backgroundType: 'gradient' | 'image' | 'plain';
    backgroundImage: string | null;
    color1: string;
    color2: string;
    textColor: string;
    textAlign: 'left' | 'center' | 'right';
    fontSizeScale: number;
    isPlain?: boolean;
}

interface ChannelGroupTheme {
    bgColor: string;
    bgColor2: string;
    textColor: string;
    fontSizeScale: number;
    backgroundType: 'gradient' | 'plain' | 'image';
    textAlign: 'left' | 'center' | 'right';
    topics: string[];
    style: 'random' | 'inspirational' | 'funny' | 'wisdom' | 'success';
    generationsPerChannel: number;
    geminiKey?: string;  // dedicated Gemini key — isolates this group's quota
}

interface ChannelGroup {
    id: string;
    name: string;
    channelIds: string[];
    theme: ChannelGroupTheme;
    createdAt: string;
    updatedAt: string;
}

interface YouTubeAccount {
    id: string;
    channelName: string;
    watermark?: string;
}

// ─── Canvas helpers ──────────────────────────────────────────────────────────

const prepareDecoration = async (url: string): Promise<HTMLCanvasElement | null> => {
    if (!url) return null;
    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        if (!img.complete) await new Promise(r => { img.onload = r; img.onerror = r; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        return canvas;
    } catch { return null; }
};

const drawCanvas = async (
    canvas: HTMLCanvasElement, quote: Quote, time = 0,
    preparedDecorations: (HTMLCanvasElement | null)[] = [],
    config: RenderConfig, watermarkText = 'AgentX'
) => {
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const progress = Math.min(time / 10000, 1);

    // Background
    if (config.isPlain || config.backgroundType === 'plain') {
        ctx.fillStyle = config.color1 || '#000000';
        ctx.fillRect(0, 0, width, height);
    } else if (config.backgroundType === 'image' && config.backgroundImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = config.backgroundImage;
        if (!img.complete) await new Promise(r => { img.onload = r; img.onerror = r; });
        const zoom = 1 + progress * 0.15;
        const scale = Math.max(width / img.width, height / img.height) * zoom;
        ctx.drawImage(img, (width / 2) - (img.width / 2) * scale, (height / 2) - (img.height / 2) * scale, img.width * scale, img.height * scale);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, width, height);
    } else {
        const t = time / 3000;
        const grad = ctx.createRadialGradient(
            width / 2 + Math.cos(t) * width * 0.3, height / 2 + Math.sin(t) * height * 0.3, 0,
            width / 2, height / 2, width
        );
        grad.addColorStop(0, config.color1 || '#1a1a1a');
        grad.addColorStop(0.5, config.color2 || '#000000');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(255,255,255,${0.03 + Math.sin(t) * 0.01})`;
        ctx.beginPath(); ctx.arc(width * 0.8, height * 0.2, width * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    // Particles
    if (config.backgroundType !== 'plain' && !config.isPlain) {
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        const speed = time / 2500;
        for (let i = 0; i < 15; i++) {
            const px = ((Math.sin(i * 123.45) + 1) / 2 * width + Math.cos(speed + i) * 60) % width;
            const py = ((Math.cos(i * 543.21) + 1) / 2 * height - speed * 120 - i * 60) % height;
            ctx.beginPath(); ctx.arc(px, py < 0 ? py + height : py, (Math.sin(i) + 1) * 2 + 1, 0, Math.PI * 2); ctx.fill();
        }
    }

    // Decorations
    for (let i = 0; i < (quote.decorations?.length || 0); i++) {
        const d = quote.decorations![i];
        try {
            const c = preparedDecorations[i] || await prepareDecoration(d.image);
            if (c) {
                const ds = width * d.size;
                ctx.globalAlpha = 0.7;
                ctx.drawImage(c, width * d.x - ds / 2, height * d.y - ds / 2 + Math.sin(time / 1500 + i) * 15, ds, ds);
            }
        } catch { }
    }
    ctx.globalAlpha = 1.0;

    // Text
    const isStory = width === 1080 && height === 1920;
    const fontSize = (isStory ? 72 : 55) * config.fontSizeScale;
    ctx.font = `bold ${fontSize}px "Outfit","Inter",sans-serif`;
    ctx.textAlign = config.textAlign;
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 0;

    const maxW = width * 0.85;
    const words = quote.text.split(' ');
    const lines: string[] = [];
    let cur = words[0];
    for (let i = 1; i < words.length; i++) {
        const test = cur + ' ' + words[i];
        if (ctx.measureText(test).width > maxW) { lines.push(cur); cur = words[i]; }
        else cur = test;
    }
    lines.push(cur);

    const lh = fontSize * 1.35;
    const startY = height / 2 - (lines.length * lh) / 2;
    const floatY = 0; // Removed floating animation for plain look
    let tx = width / 2;
    if (config.textAlign === 'left') tx = width * 0.1;
    else if (config.textAlign === 'right') tx = width * 0.9;

    lines.forEach((line, i) => {
        ctx.fillStyle = config.textColor || '#ffffff';
        ctx.fillText(line, tx, startY + i * lh + floatY);
    });

    ctx.font = `italic ${fontSize * 0.45}px "Inter",sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(`— ${quote.author}`, width / 2, startY + lines.length * lh + 70 + floatY);

    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, height - 12, width, 12);
    ctx.fillStyle = config.color1 || '#8b5cf6'; ctx.fillRect(0, height - 12, width * progress, 12);

    ctx.font = '600 26px "Inter",sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.shadowBlur = 0;
    ctx.fillText(watermarkText, width / 2, height - 90);
};

const generateVideoBlob = async (quote: Quote, config: RenderConfig, watermarkText: string): Promise<Blob | null> => {
    return new Promise(async resolve => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080; canvas.height = 1920;
        const stream = canvas.captureStream(30);
        
        let mime = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=h264';
        if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
        
        const recorder = new MediaRecorder(stream, { 
            mimeType: mime, 
            videoBitsPerSecond: 8000000 // Higher quality but faster upload if content is simple
        });
        const chunks: BlobPart[] = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mime });
            resolve(blob.size > 0 ? blob : null);
        };

        const start = Date.now();
        const DURATION = 10000; // 10s
        const decos: (HTMLCanvasElement | null)[] = [];
        for (const d of quote.decorations || []) decos.push(await prepareDecoration(d.image));
        
        recorder.start();

        const renderFrame = async () => {
            const elapsed = Date.now() - start;
            if (elapsed < DURATION) {
                await drawCanvas(canvas, quote, elapsed, decos, config, watermarkText);
                if (document.visibilityState === 'visible') {
                    requestAnimationFrame(renderFrame);
                } else {
                    // Fallback for background tab
                    setTimeout(renderFrame, 1000 / 30);
                }
            } else {
                if (recorder.state !== 'inactive') recorder.stop();
            }
        };

        // Safety timeout to ensure recorder stops
        setTimeout(() => {
            if (recorder.state !== 'inactive') recorder.stop();
        }, DURATION + 2000);

        renderFrame();
    });
};

// ─── Default theme ──────────────────────────────────────────────────────────

const defaultTheme = (): ChannelGroupTheme => ({
    bgColor: '#000000',
    bgColor2: '#1a1a2e',
    textColor: '#ffffff',
    fontSizeScale: 0.5,
    backgroundType: 'plain',
    textAlign: 'center',
    topics: [],
    style: 'random',
    generationsPerChannel: 5,
    geminiKey: '',
});

// ─── Group Editor Component ─────────────────────────────────────────────────

function GroupEditor({
    group, accounts, onSave, onCancel, isNew
}: {
    group: ChannelGroup;
    accounts: YouTubeAccount[];
    onSave: (g: ChannelGroup) => void;
    onCancel: () => void;
    isNew: boolean;
}) {
    const [draft, setDraft] = useState<ChannelGroup>(JSON.parse(JSON.stringify(group)));
    const [topicInput, setTopicInput] = useState('');

    const setTheme = (patch: Partial<ChannelGroupTheme>) =>
        setDraft(d => ({ ...d, theme: { ...d.theme, ...patch } }));

    const toggleChannel = (id: string) =>
        setDraft(d => ({
            ...d,
            channelIds: d.channelIds.includes(id)
                ? d.channelIds.filter(c => c !== id)
                : [...d.channelIds, id]
        }));

    const addTopic = () => {
        const t = topicInput.trim();
        if (t && !draft.theme.topics.includes(t)) {
            setTheme({ topics: [...draft.theme.topics, t] });
        }
        setTopicInput('');
    };

    const removeTopic = (t: string) =>
        setTheme({ topics: draft.theme.topics.filter(x => x !== t) });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-2xl h-[95vh] md:max-h-[90vh] overflow-y-auto slide-in-from-bottom-full duration-500">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-[#e5e5e7] px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center">
                            <Layers className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h2 className="text-xs font-bold text-[#1d1d1f]">
                            {isNew ? 'Create Group' : 'Edit Group'}
                        </h2>
                    </div>
                    <button onClick={onCancel} className="p-1 rounded-lg hover:bg-[#F5F5F7] transition-colors">
                        <X className="w-3.5 h-3.5 text-[#86868b]" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Group Name */}
                    <div>
                        <label className="text-[9px] font-bold text-[#86868b] uppercase tracking-wider mb-1 block">Group Name</label>
                        <input
                            type="text"
                            value={draft.name}
                            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                            placeholder="e.g. Motivation Channels"
                            className="w-full bg-[#F5F5F7] rounded-lg px-2 py-1.5 text-xs font-medium text-[#1d1d1f] focus:outline-none border border-transparent"
                        />
                    </div>

                    {/* Channel Selection */}
                    <div>
                        <label className="text-[9px] font-bold text-[#86868b] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Users className="w-2.5 h-2.5" /> Channels ({draft.channelIds.length})
                        </label>
                        <div className="bg-[#F5F5F7] rounded-xl p-1.5 max-h-32 overflow-y-auto space-y-0.5">
                            {accounts.length === 0 && (
                                <p className="text-xs text-[#86868b] text-center py-3">No accounts connected</p>
                            )}
                            {accounts.map(acc => (
                                <button
                                    key={acc.id}
                                    onClick={() => toggleChannel(acc.id)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all text-xs font-medium ${draft.channelIds.includes(acc.id)
                                        ? 'bg-black text-white'
                                        : 'hover:bg-white text-[#1d1d1f]'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${draft.channelIds.includes(acc.id) ? 'bg-white border-white' : 'border-[#86868b]'}`}>
                                        {draft.channelIds.includes(acc.id) && <Check className="w-2.5 h-2.5 text-black" />}
                                    </div>
                                    {acc.channelName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visual Theme */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider flex items-center gap-1">
                            <Palette className="w-3 h-3" /> Visual Theme
                        </label>

                        {/* Colors row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-[10px] text-[#86868b] mb-1 block">BG Color 1</label>
                                <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-lg px-2 py-1.5">
                                    <input type="color" value={draft.theme.bgColor}
                                        onChange={e => setTheme({ bgColor: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                                    <span className="text-[10px] font-mono text-[#1d1d1f]">{draft.theme.bgColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-[#86868b] mb-1 block">BG Color 2</label>
                                <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-lg px-2 py-1.5">
                                    <input type="color" value={draft.theme.bgColor2}
                                        onChange={e => setTheme({ bgColor2: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                                    <span className="text-[10px] font-mono text-[#1d1d1f]">{draft.theme.bgColor2}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-[#86868b] mb-1 block">Text Color</label>
                                <div className="flex items-center gap-2 bg-[#F5F5F7] rounded-lg px-2 py-1.5">
                                    <input type="color" value={draft.theme.textColor}
                                        onChange={e => setTheme({ textColor: e.target.value })}
                                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" />
                                    <span className="text-[10px] font-mono text-[#1d1d1f]">{draft.theme.textColor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Preview swatch */}
                        <div
                            className="h-12 rounded-xl flex items-center justify-center text-xs font-bold shadow-inner transition-all"
                            style={{
                                background: draft.theme.backgroundType === 'plain'
                                    ? draft.theme.bgColor
                                    : `linear-gradient(135deg, ${draft.theme.bgColor}, ${draft.theme.bgColor2})`,
                                color: draft.theme.textColor,
                                fontSize: `${12 * draft.theme.fontSizeScale}px`
                            }}
                        >
                            Preview Text
                        </div>

                        {/* Background type */}
                        <div>
                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">Background Type</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {(['gradient', 'plain', 'image'] as const).map(bt => (
                                    <button key={bt}
                                        onClick={() => setTheme({ backgroundType: bt })}
                                        className={`py-1.5 px-3 rounded-lg text-[11px] font-medium border transition-all ${draft.theme.backgroundType === bt ? 'bg-black text-white border-black' : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:border-[#e5e5e7]'}`}
                                    >
                                        {bt === 'gradient' ? '🌈 Gradient' : bt === 'plain' ? '🟥 Plain' : '🖼️ Image'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text align */}
                        <div>
                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">Text Align</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {(['left', 'center', 'right'] as const).map(a => (
                                    <button key={a}
                                        onClick={() => setTheme({ textAlign: a })}
                                        className={`py-1.5 px-3 rounded-lg text-[11px] font-medium border transition-all ${draft.theme.textAlign === a ? 'bg-black text-white border-black' : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:border-[#e5e5e7]'}`}
                                    >
                                        {a === 'left' ? '⬅️ Left' : a === 'center' ? '↔️ Center' : '➡️ Right'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font size */}
                        <div>
                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                Font Size Scale <span className="text-[#1d1d1f] font-mono ml-1">{draft.theme.fontSizeScale.toFixed(2)}x</span>
                            </label>
                            <input type="range" min="0.3" max="1.0" step="0.05"
                                value={draft.theme.fontSizeScale}
                                onChange={e => setTheme({ fontSizeScale: parseFloat(e.target.value) })}
                                className="w-full accent-black h-1.5 rounded-lg appearance-none cursor-pointer"
                                style={{ background: `linear-gradient(to right,#000 0%,#000 ${((draft.theme.fontSizeScale - 0.3) / 0.7) * 100}%,#e5e7eb ${((draft.theme.fontSizeScale - 0.3) / 0.7) * 100}%,#e5e7eb 100%)` }}
                            />
                            <div className="flex justify-between text-[10px] text-[#86868b] mt-1 font-mono"><span>0.3x</span><span>1.0x</span></div>
                        </div>
                    </div>

                    {/* Content Settings */}
                    <div className="space-y-3 pt-3 border-t border-[#e5e5e7]">
                        <label className="text-[9px] font-bold text-[#86868b] uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" /> Content Settings
                        </label>

                        {/* Style */}
                        <div>
                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">Quote Style</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {(['random', 'inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                                    <button key={s}
                                        onClick={() => setTheme({ style: s })}
                                        className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border transition-all ${draft.theme.style === s ? 'bg-black text-white border-black' : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:border-[#e5e5e7]'}`}
                                    >
                                        {s === 'random' ? '🎲 Random' : s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Generations per channel */}
                        <div>
                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                Videos Per Channel <span className="text-[#1d1d1f] font-mono ml-1">{draft.theme.generationsPerChannel}</span>
                            </label>
                            <input type="range" min="1" max="50"
                                value={draft.theme.generationsPerChannel}
                                onChange={e => setTheme({ generationsPerChannel: parseInt(e.target.value) })}
                                className="w-full accent-black h-1.5 rounded-lg appearance-none cursor-pointer"
                                style={{ background: `linear-gradient(to right,#000 0%,#000 ${(draft.theme.generationsPerChannel / 50) * 100}%,#e5e7eb ${(draft.theme.generationsPerChannel / 50) * 100}%,#e5e7eb 100%)` }}
                            />
                            <div className="flex justify-between text-[10px] text-[#86868b] mt-1 font-mono"><span>1</span><span>50</span></div>
                        </div>

                        {/* Topics */}
                        <div>
                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                Custom Topics
                                <span className="ml-1 font-normal normal-case text-[#86868b]">(empty = use global topics.txt)</span>
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={topicInput}
                                    onChange={e => setTopicInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTopic(); } }}
                                    placeholder="Add a topic and press Enter..."
                                    className="flex-1 bg-[#F5F5F7] rounded-lg px-3 py-2 text-xs font-medium text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-black/20 border border-transparent"
                                />
                                <button onClick={addTopic} className="px-3 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-[#333] transition-colors">
                                    Add
                                </button>
                            </div>
                            {draft.theme.topics.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {draft.theme.topics.map(t => (
                                        <span key={t} className="flex items-center gap-1 bg-[#F5F5F7] border border-[#e5e5e7] text-[#1d1d1f] text-[10px] font-medium py-1 px-2 rounded-full">
                                            {t}
                                            <button onClick={() => removeTopic(t)} className="text-[#86868b] hover:text-red-500 transition-colors"><X className="w-2.5 h-2.5" /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Gemini API Key */}
                        <div className="pt-4 border-t border-[#e5e5e7]">
                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1 flex items-center gap-1">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                Gemini API Key
                                <span className="ml-1 font-normal normal-case text-[#86868b]">(optional — isolates quota)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={draft.theme.geminiKey || ''}
                                    onChange={e => setTheme({ geminiKey: e.target.value })}
                                    placeholder="AIza... (leave empty to use shared key pool)"
                                    spellCheck={false}
                                    autoComplete="off"
                                    className="w-full bg-[#F5F5F7] rounded-lg px-3 py-2 text-xs font-mono text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-black/20 border border-transparent pr-24"
                                />
                                {draft.theme.geminiKey && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        ✓ Dedicated
                                    </span>
                                )}
                            </div>
                            <p className="text-[9px] text-[#86868b] mt-1">
                                Get a free key at <span className="font-medium text-[#1d1d1f]">aistudio.google.com</span> · Each group with its own key avoids shared quota exhaustion
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-[#e5e5e7] px-4 py-3 flex gap-2 rounded-b-2xl">
                    <button onClick={onCancel} className="flex-1 py-1.5 rounded-lg border border-[#e5e5e7] text-[10px] font-medium text-[#86868b] hover:bg-[#F5F5F7]">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(draft)}
                        className="flex-1 py-1.5 rounded-lg bg-black text-white text-[10px] font-bold flex items-center justify-center gap-1.5"
                    >
                        <Check className="w-3 h-3" />
                        {isNew ? 'Create' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── GroupCard Component ─────────────────────────────────────────────────────

function GroupCard({
    group, accounts, onEdit, onDelete, onRun, isRunning
}: {
    group: ChannelGroup;
    accounts: YouTubeAccount[];
    onEdit: () => void;
    onDelete: () => void;
    onRun: () => void;
    isRunning: boolean;
}) {
    const members = accounts.filter(a => group.channelIds.includes(a.id));

    return (
        <div className="bg-white border border-[#e5e5e7] rounded-xl p-3 shadow-sm hover:shadow-md transition-all group">
            {/* Color preview bar */}
            <div
                className="h-1.5 w-full rounded-full mb-2"
                style={{ background: group.theme.backgroundType === 'plain' ? group.theme.bgColor : `linear-gradient(90deg, ${group.theme.bgColor}, ${group.theme.bgColor2})` }}
            />

            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-[13px] font-bold text-[#1d1d1f] leading-tight">{group.name}</h3>
                        {group.theme.geminiKey && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded-full flex-shrink-0">
                                🔑 Key
                            </span>
                        )}
                    </div>
                    <p className="text-[9px] text-[#86868b] mt-0.5">
                        {members.length} ch · {group.theme.generationsPerChannel} vids/ch · {group.theme.style}
                    </p>
                </div>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-2 md:p-1 rounded-lg hover:bg-[#F5F5F7] text-[#86868b] hover:text-[#1d1d1f] transition-colors border border-[#e5e5e7] md:border-none">
                        <Edit3 className="w-3.5 h-3.5 md:w-3 md:h-3" />
                    </button>
                    <button onClick={onDelete} className="p-2 md:p-1 rounded-lg hover:bg-red-50 text-[#86868b] hover:text-red-500 transition-colors border border-[#e5e5e7] md:border-none">
                        <Trash2 className="w-3.5 h-3.5 md:w-3 md:h-3" />
                    </button>
                </div>
            </div>

            {/* Channels & Topics */}
            <div className="flex flex-wrap gap-1 mb-2">
                {members.slice(0, 3).map(m => (
                    <span key={m.id} className="bg-[#F5F5F7] text-[#1d1d1f] text-[9px] font-medium px-1.5 py-0.5 rounded-full border border-[#e5e5e7]">
                        {m.channelName}
                    </span>
                ))}
                {group.theme.topics.slice(0, 2).map(t => (
                    <span key={t} className="bg-black/5 text-[#1d1d1f] text-[8px] font-medium px-1.5 py-0.5 rounded-full">
                        # {t}
                    </span>
                ))}
            </div>

            <button
                onClick={onRun}
                disabled={isRunning || members.length === 0}
                className="w-full py-2.5 md:py-1.5 rounded-lg bg-black text-white text-[10px] font-extrabold hover:bg-[#333] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
                {isRunning ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> RUNNING</> : <><Play className="w-3.5 h-3.5" /> RUN GROUP</>}
            </button>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AutoPilotPage() {
    // Global auto-pilot state (legacy single-run)
    const [autoPilotStyle, setAutoPilotStyle] = useState<'random' | 'inspirational' | 'funny' | 'wisdom' | 'success'>('random');
    const [autoPilotGenerationsPerChannel, setAutoPilotGenerationsPerChannel] = useState(10);
    const [autoPilotBackgroundType, setAutoPilotBackgroundType] = useState<'random' | 'gradient' | 'image'>('gradient');
    const [autoPilotTextAlign, setAutoPilotTextAlign] = useState<'random' | 'left' | 'center' | 'right'>('center');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleStartTime, setScheduleStartTime] = useState(() => {
        const d = new Date(); d.setMinutes(d.getMinutes() + 60); d.setSeconds(0); d.setMilliseconds(0);
        return d.toISOString().slice(0, 16);
    });
    const [scheduleInterval, setScheduleInterval] = useState(180);
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [batchLogs, setBatchLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [availableGraphics, setAvailableGraphics] = useState<string[]>([]);
    const [delayUntil, setDelayUntil] = useState('');
    const [isWaitingForDelay, setIsWaitingForDelay] = useState(false);
    const [timeLeftMessage, setTimeLeftMessage] = useState('');

    // Groups state
    const [groups, setGroups] = useState<ChannelGroup[]>([]);
    const [accounts, setAccounts] = useState<YouTubeAccount[]>([]);
    const [editingGroup, setEditingGroup] = useState<ChannelGroup | null>(null);
    const [isEditNew, setIsEditNew] = useState(false);
    const [runningGroupId, setRunningGroupId] = useState<string | null>(null);
    const [isRunningAll, setIsRunningAll] = useState(false);
    const [activeTab, setActiveTab] = useState<'groups' | 'global'>('groups');
    const [isLoadingGroups, setIsLoadingGroups] = useState(true);
    const [isTerminalFullScreen, setIsTerminalFullScreen] = useState(false);

    // Global Concurrency Control
    const activeRenders = useRef(0);
    const activeUploads = useRef(0);
    const MAX_GLOBAL_RENDERS = 2; // Increased for better parallel speed
    const MAX_GLOBAL_UPLOADS = 5; // Increased for better parallel speed

    const waitForGlobalRender = async () => {
        while (activeRenders.current >= MAX_GLOBAL_RENDERS) {
            await new Promise(r => setTimeout(r, 1000));
        }
        activeRenders.current++;
    };

    const releaseGlobalRender = () => {
        activeRenders.current = Math.max(0, activeRenders.current - 1);
    };

    const waitForGlobalUpload = async () => {
        while (activeUploads.current >= MAX_GLOBAL_UPLOADS) {
            await new Promise(r => setTimeout(r, 500));
        }
        activeUploads.current++;
    };

    const releaseGlobalUpload = () => {
        activeUploads.current = Math.max(0, activeUploads.current - 1);
    };

    // ── Effects ────────────────────────────────────────────────────────────

    useEffect(() => {
        if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }, [batchLogs]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isWaitingForDelay && delayUntil) {
            timer = setInterval(() => {
                const diff = new Date(delayUntil).getTime() - Date.now();
                if (diff <= 0) { setIsWaitingForDelay(false); clearInterval(timer); handleStartAutoPilot(); }
                else {
                    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
                    setTimeLeftMessage(`⏳ Starting in ${h}h ${m}m ${s}s...`);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isWaitingForDelay, delayUntil]);

    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        if ((p.get('auto') === 'true' || p.get('automate') === 'true') && !isBatchRunning && !isWaitingForDelay) handleStartAutoPilot();
    }, []);

    useEffect(() => {
        fetch('/api/graphics/list').then(r => r.json()).then(d => { if (d.graphics) setAvailableGraphics(d.graphics); }).catch(() => { });
    }, []);

    // Load groups & accounts
    useEffect(() => {
        Promise.all([
            fetch('/api/channel-groups').then(r => r.json()),
            fetch('/api/youtube/accounts').then(r => r.json()),
        ]).then(([gData, aData]) => {
            setGroups(gData.groups || []);
            setAccounts(aData.accounts || []);
        }).catch(() => { }).finally(() => setIsLoadingGroups(false));
    }, []);

    // ── Group CRUD ─────────────────────────────────────────────────────────

    const refreshGroups = () => {
        fetch('/api/channel-groups').then(r => r.json()).then(d => setGroups(d.groups || []));
    };

    const handleSaveGroup = async (g: ChannelGroup) => {
        if (isEditNew) {
            await fetch('/api/channel-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
        } else {
            await fetch('/api/channel-groups', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(g) });
        }
        setEditingGroup(null);
        refreshGroups();
    };

    const handleDeleteGroup = async (id: string) => {
        if (!confirm('Delete this group?')) return;
        await fetch(`/api/channel-groups?id=${id}`, { method: 'DELETE' });
        refreshGroups();
    };

    const handleNewGroup = () => {
        const g: ChannelGroup = {
            id: '',
            name: 'New Group',
            channelIds: [],
            theme: defaultTheme(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setEditingGroup(g);
        setIsEditNew(true);
    };

    const addLog = (msg: string, groupName?: string) => {
        const time = new Date().toLocaleTimeString();
        const logLine = `[${time}] ${groupName ? `[${groupName}] ` : ''}${msg}`;
        setBatchLogs(prev => {
            const next = [...prev, logLine];
            if (next.length > 500) return next.slice(-500); 
            return next;
        });
    };

    // ── Run group auto-pilot ───────────────────────────────────────────────

    const handleRunGroup = useCallback(async (group: ChannelGroup, isNested = false) => {
        if (!isNested) setRunningGroupId(group.id);
        if (!isNested) setActiveTab('groups');

        const groupAccounts = accounts.filter(a => group.channelIds.includes(a.id));
        const geminiKeyInfo = group.theme.geminiKey
            ? `🔑 Gemini: Dedicated key (AIza...${group.theme.geminiKey.slice(-4)})`
            : `🔑 Gemini: Shared key pool`;
        
        if (!isNested) {
            setBatchLogs([
                `🚀 Running Group: "${group.name}"`,
                `📺 Channels: ${groupAccounts.map(a => a.channelName).join(', ')}`,
                `🎨 Theme: BG ${group.theme.bgColor} → ${group.theme.bgColor2} | Text ${group.theme.textColor} | Scale ${group.theme.fontSizeScale}x`,
                `📝 Style: ${group.theme.style} | ${group.theme.generationsPerChannel} videos/channel`,
                geminiKeyInfo,
            ]);
        } else {
            addLog(`🚀 [${group.name}] Starting...`);
        }

        try {
            // Get topics for this group
            let topics: string[] = group.theme.topics;
            if (topics.length === 0) {
                addLog('📖 No group topics — reading global topics.txt...', isNested ? group.name : undefined);
                const tRes = await fetch('/api/topics');
                const tData = await tRes.json();
                topics = tData.topics || [];
            }
            if (topics.length === 0) throw new Error('No topics available!');
            topics = topics.sort(() => 0.5 - Math.random());
            addLog(`✅ ${topics.length} topics loaded`, isNested ? group.name : undefined);

            let successCount = 0, failCount = 0;
            const quotaExceeded = new Set<string>();

            const videosToGenerate: { account: YouTubeAccount, topic: string, videoNum: number }[] = [];
            let topicIndex = 0;
            for (let gen = 0; gen < group.theme.generationsPerChannel; gen++) {
                for (const acc of groupAccounts) {
                    videosToGenerate.push({ account: acc, topic: topics[topicIndex++ % topics.length], videoNum: gen });
                }
            }

            addLog(`📦 Queue: ${videosToGenerate.length} videos`, isNested ? group.name : undefined);

            // --- Parallel Processing with Throttling ---
            let currentTaskIdx = 0;
            const CONCURRENCY = 3; // Process 3 videos at a time per group

            const workerLoop = async () => {
                while (currentTaskIdx < videosToGenerate.length) {
                    const taskIdx = currentTaskIdx++;
                    const task = videosToGenerate[taskIdx];
                    if (!task) break;

                    const { account, topic, videoNum } = task;
                    if (quotaExceeded.has(account.id)) { failCount++; continue; }

                    addLog(`➡️ ${account.channelName} | "${topic}" (#${videoNum + 1})`, isNested ? group.name : undefined);

                    try {
                        const styles = ['inspirational', 'wisdom', 'success', 'funny'];
                        const selStyle = group.theme.style === 'random' ? styles[Math.floor(Math.random() * styles.length)] : group.theme.style;

                        // OPTIMIZATION: Small delay to prevent API burst 429s
                        await new Promise(r => setTimeout(r, Math.random() * 1500));

                        const qRes = await fetch('/api/quotes/generate', {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                topic, count: 1, style: selStyle,
                                ...(group.theme.geminiKey ? { geminiApiKey: group.theme.geminiKey } : {})
                            })
                        });
                        const qData = await qRes.json();
                        if (!qData.quotes?.length) { addLog(`❌ Quote gen failed for ${account.channelName}`, isNested ? group.name : undefined); failCount++; continue; }

                        const quote: Quote = qData.quotes[0];
                        if (availableGraphics.length > 0) {
                            const numD = Math.floor(Math.random() * 3);
                            quote.decorations = Array.from({ length: numD }, () => ({
                                image: availableGraphics[Math.floor(Math.random() * availableGraphics.length)],
                                x: Math.random(), y: Math.random(), size: 0.15 + Math.random() * 0.25
                            }));
                        }

                        const renderConfig: RenderConfig = {
                            backgroundType: group.theme.backgroundType === 'plain' ? 'plain' : group.theme.backgroundType,
                            backgroundImage: null,
                            color1: group.theme.bgColor,
                            color2: group.theme.bgColor2,
                            textColor: group.theme.textColor,
                            textAlign: group.theme.textAlign,
                            fontSizeScale: group.theme.fontSizeScale,
                            isPlain: group.theme.backgroundType === 'plain',
                        };

                        // --- GLOBAL RENDER LOCK ---
                        addLog(`⏳ Waiting for render slot...`, isNested ? group.name : undefined);
                        await waitForGlobalRender();
                        let blob: Blob | null = null;
                        try {
                            addLog(`🎨 Rendering ${account.channelName}...`, isNested ? group.name : undefined);
                            blob = await generateVideoBlob(quote, renderConfig, account.watermark || 'AgentX');
                        } finally {
                            releaseGlobalRender();
                        }

                        if (!blob) { addLog(`❌ Render failed for ${account.channelName}`, isNested ? group.name : undefined); failCount++; continue; }

                        // --- GLOBAL UPLOAD LOCK ---
                        addLog(`⏳ Waiting for upload slot...`, isNested ? group.name : undefined);
                        await waitForGlobalUpload();
                        try {
                            const fd = new FormData();
                            fd.append('video', blob, `group-${group.id}-${Date.now()}.webm`);
                            fd.append('title', `${quote.text.substring(0, 80)} #Shorts`);
                            fd.append('description', `${quote.text}\n\n${quote.author ? `— ${quote.author}` : ''}\n\n#Shorts #${selStyle}`);
                            fd.append('tags', JSON.stringify(['shorts', 'quotes', selStyle, topic]));
                            fd.append('accountId', account.id);
                            fd.append('topic', topic);
                            fd.append('templateId', `group-${group.id}`);
                            fd.append('texts', JSON.stringify([quote.text]));

                            if (isScheduled) {
                                const publishTime = new Date(new Date(scheduleStartTime).getTime() + videoNum * scheduleInterval * 60000);
                                fd.append('publishAt', publishTime.toISOString());
                            }

                            const upRes = await fetch('/api/youtube/upload-video', { method: 'POST', body: fd });
                            const upData = await upRes.json();

                            if (upRes.status === 429 || upData.error?.includes('Daily Upload Limit')) {
                                addLog(`⚠️ QUOTA EXCEEDED: ${account.channelName}`, isNested ? group.name : undefined);
                                quotaExceeded.add(account.id); failCount++;
                            } else if (!upData.success) {
                                addLog(`❌ Upload failed: ${upData.error}`, isNested ? group.name : undefined); failCount++;
                            } else {
                                addLog(`✅ Uploaded: ${upData.videoUrl}`, isNested ? group.name : undefined); successCount++;
                            }
                        } finally {
                            releaseGlobalUpload();
                        }
                    } catch (err: any) {
                        addLog(`❌ Task failed: ${err.message}`, isNested ? group.name : undefined);
                        failCount++;
                    }
                }
            };

            // Start workers
            await Promise.all(Array(Math.min(CONCURRENCY, videosToGenerate.length)).fill(null).map(workerLoop));

            addLog(`\n✨ GROUP COMPLETE: "${group.name}" | ${successCount} success, ${failCount} failed`, isNested ? group.name : undefined);
            return { successCount, failCount };
        } catch (e: any) {
            addLog(`❌ CRITICAL: ${e.message}`);
            return { successCount: 0, failCount: 0 };
        } finally {
            if (!isNested) setRunningGroupId(null);
        }
    }, [accounts, isScheduled, scheduleStartTime, scheduleInterval, isRunningAll, runningGroupId]);

    const handleRunAllGroups = async () => {
        if (groups.length === 0) return;
        if (!confirm(`Run all ${groups.length} groups in parallel?`)) return;

        setIsRunningAll(true);
        setBatchLogs([`🚀 STARTING ALL GROUPS PARALLEL RUN...`, `📦 Groups to run: ${groups.length}`]);
        
        try {
            // OPTIMIZATION: Run groups in smaller batches to avoid browser lag
            // but keep them moving. We process up to 2 groups fully in parallel.
            const BATCH_SIZE = 2;
            for (let i = 0; i < groups.length; i += BATCH_SIZE) {
                const batch = groups.slice(i, i + BATCH_SIZE);
                addLog(`▶️ Processing Group Batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
                await Promise.all(batch.map(g => handleRunGroup(g, true)));
            }
            
            setBatchLogs(prev => [...prev, `\n✨ ALL GROUPS FINISHED!`]);
        } catch (error: any) {
            setBatchLogs(prev => [...prev, `\n❌ RUN ALL FAILED: ${error.message}`]);
        } finally {
            setIsRunningAll(false);
        }
    };

    // ── Global auto-pilot (legacy) ─────────────────────────────────────────

    const addBatchLog = (msg: string) => addLog(msg);

    const handleStartAutoPilot = useCallback(async () => {
        const schedInfo = isScheduled ? `\n- Scheduling: ENABLED (${new Date(scheduleStartTime).toLocaleString()}, every ${scheduleInterval}m)` : '\n- Scheduling: DISABLED';
        const settingsInfo = `Auto-Pilot Settings:\n- Style: ${autoPilotStyle}\n- Gens per channel: ${autoPilotGenerationsPerChannel}\n- BG: ${autoPilotBackgroundType}\n- Align: ${autoPilotTextAlign}${schedInfo}`;
        const p = new URLSearchParams(window.location.search);
        const isAuto = p.get('auto') === 'true' || p.get('automate') === 'true';
        if (!isAuto && !confirm(`Start Global Auto-Pilot?\n\n${settingsInfo}\n\nThis will generate ${autoPilotGenerationsPerChannel} video(s) for EVERY connected account.`)) return;

        setIsBatchRunning(true);
        setBatchLogs(["🚀 Starting Global Auto-Pilot...", settingsInfo]);

        try {
            addBatchLog("📋 Fetching accounts...");
            const aRes = await fetch('/api/youtube/accounts');
            const aData = await aRes.json();
            const accs = aData.accounts || [];
            if (accs.length === 0) throw new Error("No YouTube accounts connected!");
            addBatchLog(`✅ ${accs.length} accounts: ${accs.map((a: any) => a.channelName).join(', ')}`);

            addBatchLog("📖 Reading topics.txt...");
            const tRes = await fetch('/api/topics');
            const tData = await tRes.json();
            let topics = tData.topics || [];
            if (topics.length === 0) throw new Error("No topics found!");
            topics = topics.sort(() => 0.5 - Math.random());
            addBatchLog(`✅ ${topics.length} topics`);

            let topicIndex = 0, successCount = 0, failCount = 0;
            const quotaExceeded = new Set<string>();
            const accountVideoCount = new Map<string, number>();

            const videosToGenerate: Array<{ account: any; topic: string; videoNum: number }> = [];
            for (let gen = 0; gen < autoPilotGenerationsPerChannel; gen++) {
                for (let i = 0; i < accs.length; i++) {
                    if (gen === 0) accountVideoCount.set(accs[i].id, 0);
                    videosToGenerate.push({ account: accs[i], topic: topics[topicIndex++ % topics.length], videoNum: gen });
                }
            }

            addBatchLog(`📦 Queue: ${videosToGenerate.length} videos`);

            let currentIdx = 0;
            const processTask = async (taskIdx: number): Promise<void> => {
                const task = videosToGenerate[taskIdx];
                if (!task) return;
                const { account, topic, videoNum } = task;

                if (quotaExceeded.has(account.id)) {
                    const avail = accs.find((a: any) => !quotaExceeded.has(a.id));
                    if (avail) { videosToGenerate[taskIdx] = { ...task, account: avail }; return processTask(taskIdx); }
                    addBatchLog(`⏭️ Skipping (quota exceeded)`); return;
                }

                addBatchLog(`\n➡️  ${account.channelName} | "${topic}"`);

                const styles = ['inspirational', 'wisdom', 'success', 'funny'];
                const selStyle = autoPilotStyle === 'random' ? styles[Math.floor(Math.random() * styles.length)] : autoPilotStyle;

                // OPTIMIZATION: Small delay to prevent API burst 429s
                await new Promise(r => setTimeout(r, Math.random() * 1500));

                const qRes = await fetch("/api/quotes/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, count: 1, style: selStyle }) });
                const qData = await qRes.json();
                if (!qData.quotes?.length) { addBatchLog(`❌ Quote gen failed`); failCount++; return; }

                const quote: Quote = qData.quotes[0];
                if (availableGraphics.length > 0) {
                    quote.decorations = Array.from({ length: Math.floor(Math.random() * 4) }, () => ({
                        image: availableGraphics[Math.floor(Math.random() * availableGraphics.length)],
                        x: Math.random(), y: Math.random(), size: 0.15 + Math.random() * 0.25
                    }));
                }

                const aligns: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
                const alignment = autoPilotTextAlign === 'random' ? aligns[Math.floor(Math.random() * aligns.length)] : autoPilotTextAlign as 'left' | 'center' | 'right';

                const renderConfig: RenderConfig = {
                    backgroundType: 'plain', backgroundImage: null,
                    color1: '#000000', color2: '#000000',
                    textColor: '#ffffff', textAlign: alignment,
                    fontSizeScale: 0.45 + Math.random() * 0.15, isPlain: true,
                };

                // --- GLOBAL RENDER LOCK ---
                addBatchLog(`⏳ [${account.channelName}] Waiting for render slot...`);
                await waitForGlobalRender();
                let blob: Blob | null = null;
                try {
                    addBatchLog(`🎨 Rendering ${account.channelName}...`);
                    blob = await generateVideoBlob(quote, renderConfig, account.watermark || 'AgentX');
                } finally {
                    releaseGlobalRender();
                }

                if (!blob) { addBatchLog(`❌ Render failed`); failCount++; return; }

                // --- GLOBAL UPLOAD LOCK ---
                addBatchLog(`⏳ [${account.channelName}] Waiting for upload slot...`);
                await waitForGlobalUpload();
                try {
                    const fd = new FormData();
                    fd.append('video', blob, `autopilot-${Date.now()}.webm`);
                    fd.append('title', `${quote.text.substring(0, 80)} #Shorts`);
                    fd.append('description', `${quote.text}\n\n${quote.author ? `— ${quote.author}` : ''}\n\n#Shorts #Quotes`);
                    fd.append('tags', JSON.stringify(['shorts', 'quotes', selStyle, topic]));
                    fd.append('accountId', account.id);
                    fd.append('topic', topic); fd.append('templateId', 'quote-autopilot');
                    fd.append('texts', JSON.stringify([quote.text]));
                    if (isScheduled) {
                        fd.append('publishAt', new Date(new Date(scheduleStartTime).getTime() + videoNum * scheduleInterval * 60000).toISOString());
                    }

                    const upRes = await fetch('/api/youtube/upload-video', { method: 'POST', body: fd });
                    const upData = await upRes.json();

                    if (upRes.status === 429 || upData.error?.includes('Daily Upload Limit')) {
                        addBatchLog(`⚠️ QUOTA EXCEEDED: ${account.channelName}`);
                        quotaExceeded.add(account.id);
                        const avail = accs.find((a: any) => !quotaExceeded.has(a.id));
                        if (avail) { videosToGenerate[taskIdx] = { ...task, account: avail }; return processTask(taskIdx); }
                        failCount++; return;
                    }
                    if (!upData.success) { addBatchLog(`❌ Upload failed: ${upData.error}`); failCount++; return; }
                    addBatchLog(`✅ ${account.channelName} | ${upData.videoUrl}`); successCount++;
                    accountVideoCount.set(account.id, (accountVideoCount.get(account.id) || 0) + 1);
                } finally {
                    releaseGlobalUpload();
                }
            };

            const workerLoop = async () => { while (currentIdx < videosToGenerate.length) { const idx = currentIdx++; await processTask(idx); } };
            
            addBatchLog("⚠️ IMPORTANT: Keep this tab open and active for best video quality.");
            await Promise.all(Array(Math.min(3, videosToGenerate.length)).fill(null).map(workerLoop));

            addBatchLog(`\n✨ COMPLETE! ${successCount} success, ${failCount} failed`);
            accs.forEach((a: any) => addBatchLog(`   ${quotaExceeded.has(a.id) ? '⚠️' : '✅'} ${a.channelName}: ${accountVideoCount.get(a.id) || 0} video(s)`));
        } catch (e: any) {
            addBatchLog(`❌ CRITICAL ERROR: ${e.message}`);
        } finally {
            setIsBatchRunning(false);
            const p = new URLSearchParams(window.location.search);
            if (p.get('auto') === 'true' || p.get('automate') === 'true') {
                addBatchLog("🏁 Finished. Closing in 5s..."); setTimeout(() => window.close(), 5000);
            }
        }
    }, [autoPilotStyle, autoPilotGenerationsPerChannel, autoPilotBackgroundType, autoPilotTextAlign, isScheduled, scheduleStartTime, scheduleInterval, availableGraphics]);

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="flex min-h-screen bg-[#F5F5F7]">
            <LeftSidebar />

            {/* Group Editor Modal */}
            {editingGroup && (
                <GroupEditor
                    group={editingGroup}
                    accounts={accounts}
                    onSave={handleSaveGroup}
                    onCancel={() => setEditingGroup(null)}
                    isNew={isEditNew}
                />
            )}

            <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-8">
                {/* Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-[#e5e5e7]">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-2 md:py-3">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <div className="p-1 bg-black rounded-lg">
                                    <Rocket className="w-3.5 h-3.5 text-white" />
                                </div>
                                <h1 className="text-xs md:text-sm font-bold text-[#1d1d1f]">Auto-Pilot</h1>
                            </div>
                            <div className="flex gap-1 bg-[#F5F5F7] p-0.5 rounded-lg border border-[#e5e5e7] shrink-0">
                                {([['groups', '📦 Groups'], ['global', '🌍 Global']] as const).map(([t, label]) => (
                                    <button key={t} onClick={() => setActiveTab(t)}
                                        className={`px-3 py-1.5 md:py-1 rounded-md text-[10px] font-bold transition-all ${activeTab === t ? 'bg-black text-white shadow-sm' : 'text-[#86868b] hover:text-[#1d1d1f]'}`}
                                    >
                                        <span className="hidden sm:inline">{label}</span>
                                        <span className="sm:hidden">{label.split(' ')[1]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 space-y-3">
                    {/* ── GROUPS TAB ── */}
                    {activeTab === 'groups' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Groups grid */}
                            <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[11px] font-bold text-[#1d1d1f] uppercase tracking-wider hidden xs:block">Channel Groups</h2>
                                        <div className="flex gap-1 w-full xs:w-auto">
                                            <button onClick={refreshGroups} className="p-2 md:p-1 rounded-lg border border-[#e5e5e7] bg-white hover:bg-[#F5F5F7]">
                                                <RefreshCw className="w-3.5 h-3.5 md:w-3 md:h-3 text-[#86868b]" />
                                            </button>
                                            <button
                                                onClick={handleRunAllGroups}
                                                disabled={isRunningAll || groups.length === 0}
                                                className="flex-1 xs:flex-none flex items-center justify-center gap-1 px-3 py-2 md:px-2.5 md:py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 disabled:opacity-50"
                                            >
                                                {isRunningAll ? <Loader2 className="w-3.5 h-3.5 md:w-3 md:h-3 animate-spin" /> : <Zap className="w-3.5 h-3.5 md:w-3 md:h-3" />}
                                                <span className="xs:inline">Run All</span>
                                            </button>
                                            <button
                                                onClick={handleNewGroup}
                                                className="flex-1 xs:flex-none flex items-center justify-center gap-1 px-3 py-2 md:px-2.5 md:py-1 bg-black text-white rounded-lg text-[10px] font-bold"
                                            >
                                                <Plus className="w-3.5 h-3.5 md:w-3 md:h-3" />
                                                <span className="xs:inline">New Group</span>
                                            </button>
                                        </div>
                                    </div>

                                {isLoadingGroups ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-5 h-5 animate-spin text-[#86868b]" />
                                    </div>
                                ) : groups.length === 0 ? (
                                    <div className="bg-white border border-dashed border-[#e5e5e7] rounded-xl p-8 text-center">
                                        <Layers className="w-8 h-8 text-[#86868b] mx-auto mb-3 opacity-50" />
                                        <p className="text-xs font-bold text-[#1d1d1f] mb-1">No groups yet</p>
                                        <p className="text-[10px] text-[#86868b] mb-4">Create your first channel group to assign themes and topics</p>
                                        <button onClick={handleNewGroup} className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-[#333] transition-colors inline-flex items-center gap-1.5">
                                            <Plus className="w-3.5 h-3.5" /> Create First Group
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {groups.map(g => (
                                            <GroupCard
                                                key={g.id} group={g} accounts={accounts}
                                                onEdit={() => { setEditingGroup(g); setIsEditNew(false); }}
                                                onDelete={() => handleDeleteGroup(g.id)}
                                                onRun={() => handleRunGroup(g)}
                                                isRunning={runningGroupId === g.id || isRunningAll}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Logs */}
                            <div className="space-y-3">
                                <div className="bg-white border border-[#e5e5e7] rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <Terminal className="text-[#1d1d1f]" size={14} />
                                        <h2 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">System Logs</h2>
                                        <div className="ml-auto flex items-center gap-3">
                                            {batchLogs.length > 0 && (
                                                <button onClick={() => setBatchLogs([])} className="text-[10px] text-[#86868b] hover:text-red-500 transition-colors">Clear</button>
                                            )}
                                            <button 
                                                onClick={() => setIsTerminalFullScreen(true)}
                                                className="p-1 hover:bg-[#F5F5F7] rounded-md text-[#86868b] hover:text-[#1d1d1f] transition-all"
                                                title="Full Screen Terminal"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    {batchLogs.length > 0 ? (
                                        <div className="bg-[#111] border border-[#333] rounded-lg p-3 font-mono text-[10px] h-[400px] overflow-y-auto no-scrollbar shadow-inner">
                                            <div className="space-y-0.5">
                                                {batchLogs.map((log, i) => (
                                                    <div key={i} className="whitespace-pre-wrap text-white">{log}</div>
                                                ))}
                                                <div ref={logsEndRef} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-[#F5F5F7] border border-[#e5e5e7] rounded-lg p-6 text-center">
                                            <Terminal className="w-8 h-8 text-[#86868b] mx-auto mb-2 opacity-50" />
                                            <p className="text-xs text-[#86868b]">Run a group to see activity here</p>
                                        </div>
                                    )}
                                </div>

                                {/* Scheduling options for group runs */}
                                <div className="bg-white border border-[#e5e5e7] rounded-xl p-3 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Clock className="text-[#1d1d1f]" size={13} />
                                        <h2 className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-wider">Scheduling</h2>
                                        <button
                                            onClick={() => setIsScheduled(!isScheduled)}
                                            className={`ml-auto relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${isScheduled ? 'bg-black' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-2.5 w-2.5 rounded-full bg-white transition-transform ${isScheduled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                    {isScheduled && (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">First Publish Time</label>
                                                <input type="datetime-local" value={scheduleStartTime} onChange={e => setScheduleStartTime(e.target.value)}
                                                    className="w-full bg-[#F5F5F7] rounded-md px-3 py-2 text-xs font-medium focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">Interval (Minutes)</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="number" min="15" max="1440" value={scheduleInterval}
                                                        onChange={e => setScheduleInterval(parseInt(e.target.value))}
                                                        className="flex-1 bg-[#F5F5F7] rounded-md px-3 py-2 text-xs font-medium focus:outline-none" />
                                                    <span className="text-[10px] text-[#86868b] min-w-[50px]">{Math.floor(scheduleInterval / 60)}h {scheduleInterval % 60}m</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── GLOBAL TAB ── */}
                    {activeTab === 'global' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Settings */}
                            <div className="space-y-4">
                                <div className="bg-white border border-[#e5e5e7] rounded-xl p-3 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-3">
                                        <SettingsIcon className="text-[#1d1d1f]" size={13} />
                                        <h2 className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-wider">Global Settings</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Style */}
                                        <div>
                                            <label className="text-[9px] font-bold text-[#86868b] uppercase tracking-wider mb-1 block">Style</label>
                                            <div className="grid grid-cols-2 gap-1">
                                                {(['random', 'inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                                                    <button key={s} onClick={() => setAutoPilotStyle(s)}
                                                        className={`py-1 px-1.5 rounded-md font-medium text-[10px] transition-all border ${autoPilotStyle === s ? 'bg-black text-white border-black' : 'bg-[#F5F5F7] text-[#86868b] border-transparent'}`}
                                                    >
                                                        {s === 'random' ? '🎲' : s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Generations */}
                                        <div>
                                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                                Generations Per Channel <span className="text-[#1d1d1f] font-mono ml-1">{autoPilotGenerationsPerChannel}</span>
                                            </label>
                                            <input type="range" min="1" max="50" value={autoPilotGenerationsPerChannel}
                                                onChange={e => setAutoPilotGenerationsPerChannel(parseInt(e.target.value))}
                                                className="w-full accent-black h-1.5 rounded-lg appearance-none cursor-pointer"
                                                style={{ background: `linear-gradient(to right,#000 0%,#000 ${(autoPilotGenerationsPerChannel / 50) * 100}%,#e5e7eb ${(autoPilotGenerationsPerChannel / 50) * 100}%,#e5e7eb 100%)` }}
                                            />
                                            <div className="flex justify-between text-[10px] text-[#86868b] mt-1 font-mono"><span>1</span><span>50</span></div>
                                        </div>

                                        {/* BG Type */}
                                        <div>
                                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">Background Type</label>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {(['random', 'gradient', 'image'] as const).map(bg => (
                                                    <button key={bg} onClick={() => setAutoPilotBackgroundType(bg)}
                                                        className={`py-1.5 px-2 rounded-md font-medium text-[11px] transition-all border ${autoPilotBackgroundType === bg ? 'bg-black text-white border-black' : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:bg-[#e5e5e7]'}`}
                                                    >
                                                        {bg === 'random' ? '🎲' : bg === 'gradient' ? '🌈' : '🖼️'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Text align */}
                                        <div>
                                            <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">Text Alignment</label>
                                            <div className="grid grid-cols-4 gap-1.5">
                                                {(['random', 'left', 'center', 'right'] as const).map(a => (
                                                    <button key={a} onClick={() => setAutoPilotTextAlign(a)}
                                                        className={`py-1.5 px-2 rounded-md font-medium text-[11px] transition-all border ${autoPilotTextAlign === a ? 'bg-black text-white border-black' : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:bg-[#e5e5e7]'}`}
                                                    >
                                                        {a === 'random' ? '🎲' : a === 'left' ? '⬅️' : a === 'center' ? '↔️' : '➡️'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Scheduling */}
                                        <div className="pt-3 border-t border-[#e5e5e7]">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-[#1d1d1f] block">YouTube Native Scheduling</label>
                                                    <p className="text-[10px] text-[#86868b]">Upload now, publish automatically later</p>
                                                </div>
                                                <button onClick={() => setIsScheduled(!isScheduled)}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isScheduled ? 'bg-black' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isScheduled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>
                                            {isScheduled && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">First Video Publish Time</label>
                                                        <input type="datetime-local" value={scheduleStartTime} onChange={e => setScheduleStartTime(e.target.value)}
                                                            className="w-full bg-[#F5F5F7] rounded-md px-3 py-2 text-xs font-medium focus:outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">Post Interval (Minutes)</label>
                                                        <div className="flex items-center gap-2">
                                                            <input type="number" min="15" max="1440" value={scheduleInterval}
                                                                onChange={e => setScheduleInterval(parseInt(e.target.value))}
                                                                className="flex-1 bg-[#F5F5F7] rounded-md px-3 py-2 text-xs font-medium focus:outline-none" />
                                                            <span className="text-[10px] text-[#86868b] min-w-[50px]">{Math.floor(scheduleInterval / 60)}h {scheduleInterval % 60}m</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Delayed execution */}
                                        <div className="pt-3 border-t border-[#e5e5e7]">
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <label className="text-[11px] font-bold text-[#1d1d1f] block">Delayed Execution</label>
                                                    <p className="text-[10px] text-[#86868b]">Wait for a specific time to start</p>
                                                </div>
                                                <button onClick={() => { if (!delayUntil) { const d = new Date(); d.setMinutes(d.getMinutes() + 5); setDelayUntil(d.toISOString().slice(0, 16)); } else { setDelayUntil(''); setIsWaitingForDelay(false); } }}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${delayUntil ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${delayUntil ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                </button>
                                            </div>
                                            {delayUntil && (
                                                <div>
                                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">Start At</label>
                                                    <input type="datetime-local" value={delayUntil} onChange={e => setDelayUntil(e.target.value)} disabled={isWaitingForDelay}
                                                        className="w-full bg-[#F5F5F7] rounded-md px-3 py-2 text-xs font-medium focus:outline-none disabled:opacity-50" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Start button */}
                                        <button
                                            onClick={() => {
                                                if (delayUntil && !isWaitingForDelay) { setIsWaitingForDelay(true); addBatchLog(`⏲️ Scheduled for ${new Date(delayUntil).toLocaleString()}`); }
                                                else if (isWaitingForDelay) { setIsWaitingForDelay(false); addBatchLog('🛑 Cancelled.'); }
                                                else handleStartAutoPilot();
                                            }}
                                            disabled={isBatchRunning}
                                            className={`w-full font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 ${isWaitingForDelay ? 'bg-indigo-600 text-white' : 'bg-black hover:bg-[#333] text-white'}`}
                                        >
                                            {isBatchRunning ? <><Loader2 className="animate-spin" size={14} /> Running...</>
                                                : isWaitingForDelay ? <><Clock className="animate-pulse" size={14} />{timeLeftMessage || 'Waiting...'}</>
                                                    : <>{delayUntil ? <Clock size={14} /> : <Rocket size={14} />}{delayUntil ? 'Schedule' : 'Start Global Auto-Pilot'}</>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Logs */}
                            <div>
                                <div className="bg-white border border-[#e5e5e7] rounded-xl p-3 shadow-sm">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Terminal className="text-[#1d1d1f]" size={13} />
                                        <h2 className="text-[10px] font-bold text-[#1d1d1f] uppercase tracking-wider">System Logs</h2>
                                        {batchLogs.length > 0 && <button onClick={() => setBatchLogs([])} className="ml-auto text-[9px] text-[#86868b] hover:text-red-500">Clear</button>}
                                    </div>
                                    {batchLogs.length > 0 ? (
                                        <div className="bg-[#111] border border-[#333] rounded-lg p-3 font-mono text-[9px] h-[350px] overflow-y-auto no-scrollbar shadow-inner">
                                            {batchLogs.map((log, i) => <div key={i} className="whitespace-pre-wrap text-white/90">{log}</div>)}
                                            <div ref={logsEndRef} />
                                        </div>
                                    ) : (
                                        <div className="bg-[#F5F5F7] border border-[#e5e5e7] rounded-lg p-5 text-center">
                                            <Terminal className="w-7 h-7 text-[#86868b] mx-auto mb-2 opacity-50" />
                                            <p className="text-[10px] text-[#86868b]">Logs will appear here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── FULL SCREEN TERMINAL OVERLAY ── */}
                    {isTerminalFullScreen && (
                        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                            {/* Header */}
                            <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <Terminal className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base md:text-lg">AgentX Engine v2.0</h3>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Auto-Pilot Active Session</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 md:gap-4">
                                    <button 
                                        onClick={() => setBatchLogs([])}
                                        className="px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white text-xs font-bold transition-all"
                                    >
                                        CLEAR
                                    </button>
                                    <button 
                                        onClick={() => setIsTerminalFullScreen(false)}
                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all shadow-lg"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Logs content */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 font-mono text-xs md:text-sm no-scrollbar bg-black/40">
                                <div className="max-w-4xl mx-auto space-y-1.5 md:space-y-2">
                                    {batchLogs.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-white/20 py-20">
                                            <Terminal size={48} className="mb-4 opacity-10" />
                                            <p className="font-bold tracking-tighter uppercase">Waiting for activity...</p>
                                        </div>
                                    ) : (
                                        batchLogs.map((log, i) => {
                                            const isSuccess = log.includes("✅");
                                            const isError = log.includes("❌") || log.includes("⚠️") || log.includes("CRITICAL");
                                            const isSummary = log.includes("✨");
                                            const isStarting = log.includes("🚀");

                                            return (
                                                <div 
                                                    key={i} 
                                                    className={`
                                                        py-1 border-b border-white/5 transition-colors
                                                        ${isSuccess ? 'text-emerald-400' : 
                                                          isError ? 'text-rose-400' : 
                                                          isSummary ? 'text-indigo-400 font-bold text-base py-4 border-white/10' : 
                                                          isStarting ? 'text-amber-400 font-bold' :
                                                          'text-white/70'}
                                                    `}
                                                >
                                                    {log}
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                            
                            {/* Footer Status */}
                            <div className="p-4 bg-black border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Network Secure</span>
                                </div>
                                <span className="text-[10px] text-white/20 font-mono">
                                    SESSION_ID: {Math.random().toString(36).substring(7).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            <MobileNav />
        </div>
    );
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: string; }) {
    return (
        <div className="bg-white border border-[#e5e5e7] rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className={`inline-flex p-1.5 rounded-md bg-gradient-to-br ${color} text-white mb-2`}>{icon}</div>
            <h3 className="font-bold text-[11px] text-[#1d1d1f] mb-0.5">{title}</h3>
            <p className="text-[10px] text-[#86868b]">{description}</p>
        </div>
    );
}
