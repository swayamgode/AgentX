"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Download, Share2, RefreshCw, Smartphone, Monitor, Image as ImageIcon, Palette, Video, Music, Upload, Type, AlignLeft, AlignCenter, AlignRight, Minus, Plus, Calendar, Clock, Play, Pause, Youtube } from "lucide-react";
import { MusicLibrary, MusicTrack, getTrackUrl, fetchTrackAsBlob } from "@/lib/music-library";

interface Quote {
    text: string;
    author: string;
    category: string;
}

export function QuotesGenerator() {
    const [topic, setTopic] = useState("");
    const [style, setStyle] = useState<'inspirational' | 'funny' | 'wisdom' | 'success'>('inspirational');
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Formatting & Customization State
    const [aspectRatio, setAspectRatio] = useState<'square' | 'story'>('story'); // Default to story (9:16)
    const [backgroundType, setBackgroundType] = useState<'gradient' | 'image'>('gradient');
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [color1, setColor1] = useState('#667eea');
    const [color2, setColor2] = useState('#764ba2');
    const [audioFile, setAudioFile] = useState<File | null>(null);

    // Music Library State
    const [musicLibrary, setMusicLibrary] = useState<MusicLibrary | null>(null);
    const [selectedMood, setSelectedMood] = useState<string>('motivational');
    const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
    const [useLibraryMusic, setUseLibraryMusic] = useState(true);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);

    // Text Customization State
    const [textColor, setTextColor] = useState('#ffffff');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
    const [fontSizeScale, setFontSizeScale] = useState(1); // 0.8 to 1.5

    // Scheduling & Batch State
    const [quoteCount, setQuoteCount] = useState(1);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleProgress, setScheduleProgress] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [scheduleInterval, setScheduleInterval] = useState(60); // minutes

    // YouTube Account State
    const [youtubeAccounts, setYoutubeAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const audioPreviewRef = useRef<HTMLAudioElement>(null);

    // Load music library and YouTube accounts on mount
    useEffect(() => {
        async function loadMusicLibrary() {
            try {
                const response = await fetch('/api/music/list');
                const data = await response.json();
                setMusicLibrary(data);
                // Set default track (first motivational track)
                const defaultTrack = data.tracks.find((t: MusicTrack) => t.mood === 'motivational');
                if (defaultTrack) {
                    setSelectedTrack(defaultTrack);
                }
            } catch (error) {
                console.error('Failed to load music library:', error);
            }
        }

        async function loadYouTubeAccounts() {
            try {
                const response = await fetch('/api/youtube/accounts');
                const data = await response.json();
                setYoutubeAccounts(data.accounts || []);
                // Set active account as default
                const activeAccount = data.accounts?.find((acc: any) => acc.isActive);
                if (activeAccount) {
                    setSelectedAccountId(activeAccount.id);
                }
            } catch (error) {
                console.error('Failed to load YouTube accounts:', error);
            }
        }

        loadMusicLibrary();
        loadYouTubeAccounts();
    }, []);

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/quotes/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, count: quoteCount, style })
            });
            const data = await res.json();
            if (data.quotes) {
                setQuotes(data.quotes);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBackgroundImage(url);
            setBackgroundType('image');
        }
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
            setUseLibraryMusic(false);
        }
    };

    const togglePreview = () => {
        if (!audioPreviewRef.current || !selectedTrack) return;

        if (isPlayingPreview) {
            audioPreviewRef.current.pause();
            setIsPlayingPreview(false);
        } else {
            audioPreviewRef.current.play();
            setIsPlayingPreview(true);
        }
    };

    const handleTrackSelect = (track: MusicTrack) => {
        setSelectedTrack(track);
        setUseLibraryMusic(true);
        setIsPlayingPreview(false);
        if (audioPreviewRef.current) {
            audioPreviewRef.current.pause();
            audioPreviewRef.current.currentTime = 0;
        }
    };

    /**
     * Draws a single frame to the canvas.
     * @param canvas The canvas element
     * @param quote The quote to draw
     * @param time The current animation time in ms
     */
    const drawCanvas = async (canvas: HTMLCanvasElement, quote: Quote, time: number = 0) => {
        const ctx = canvas.getContext('2d')!;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Animation factors (0 to 1 over 10 seconds)
        const progress = Math.min(time / 10000, 1);
        const zoom = 1 + (progress * 0.1); // Zoom from 1.0 to 1.1

        // 1. Draw Background
        if (backgroundType === 'image' && backgroundImage) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = backgroundImage;

            // Ensure image is loaded before drawing
            if (!img.complete) {
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }

            // Cover fit with Zoom effect
            const scale = Math.max(width / img.width, height / img.height) * zoom;
            const x = (width / 2) - (img.width / 2) * scale;
            const y = (height / 2) - (img.height / 2) * scale;

            ctx.save();
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            ctx.restore();

            // Dark overlay for readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, width, height);
        } else {
            // Gradient Background
            // We can animate the gradient slightly by shifting the stop points or colors? 
            // For now, static gradient is clean.
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, color1);
            grad.addColorStop(1, color2);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }

        // 2. Draw Text Configuration
        ctx.fillStyle = textColor;
        const isStory = width === 1080 && height === 1920;
        const baseFontSize = isStory ? 64 : 50;
        const fontSize = baseFontSize * fontSizeScale;

        ctx.font = `bold ${fontSize}px "Inter", Arial, sans-serif`;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'middle';

        // Add shadow for better readability
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Word wrap
        const maxLineWidth = width * 0.8;
        const words = quote.text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxLineWidth) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        // 3. Draw Quote Text
        const lineHeight = fontSize * 1.4;
        const totalHeight = lines.length * lineHeight;
        const startY = (height / 2) - (totalHeight / 2);

        // Subtle Float Animation for text
        const floatY = Math.sin(time / 2000) * 10;

        // Calculate X positioning based on alignment
        let textX = width / 2; // Default center
        if (textAlign === 'left') textX = width * 0.1;
        else if (textAlign === 'right') textX = width * 0.9;

        lines.forEach((line, i) => {
            ctx.fillText(line, textX, startY + i * lineHeight + floatY);
        });

        // 4. Draw Author
        ctx.font = `italic ${fontSize * 0.6}px "Inter", Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(`- ${quote.author}`, width / 2, startY + totalHeight + 40 + floatY);

        // 5. Draw Watermark/Brand
        const selectedAccount = youtubeAccounts.find(acc => acc.id === selectedAccountId);
        const watermarkText = selectedAccount?.watermark || 'AgentX';
        ctx.font = `500 24px "Inter", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 0; // Remove shadow for watermark
        ctx.fillText(watermarkText, width / 2, height - 80);
    };

    const downloadImage = async (quote: Quote, index: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = aspectRatio === 'story' ? 1920 : 1080;

        await drawCanvas(canvas, quote, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `quote-${index + 1}.png`;
                a.click();
                URL.revokeObjectURL(url);
            }
        });
    };

    const generateVideoBlob = async (quote: Quote): Promise<Blob | null> => {
        return new Promise(async (resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = aspectRatio === 'story' ? 1920 : 1080;

            // SIMPLIFIED: No audio for now to fix YouTube processing issues
            // Audio mixing was causing "Processing abandoned" errors
            const canvasStream = canvas.captureStream(30);

            // Try H.264 first (better YouTube compatibility), fallback to VP9
            let mimeType = 'video/webm;codecs=h264';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm;codecs=vp9';
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm';
            }

            const mediaRecorder = new MediaRecorder(canvasStream, {
                mimeType: mimeType,
                videoBitsPerSecond: 5000000 // 5 Mbps for better quality
            });

            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };

            mediaRecorder.start();

            const duration = 30000; // 30 seconds (safer for Shorts, reduces processing load)
            const startTime = Date.now();

            const animate = async () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < duration) {
                    await drawCanvas(canvas, quote, elapsed);
                    requestAnimationFrame(animate);
                } else {
                    mediaRecorder.stop();
                }
            };
            animate();
        });
    };

    const downloadVideo = async (quote: Quote, index: number) => {
        const blob = await generateVideoBlob(quote);
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quote-video-${index + 1}.webm`; // Fixed: Use correct extension
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleSchedule = async () => {
        if (!scheduleTime || quotes.length === 0) return;
        setIsScheduling(true);
        setScheduleProgress('Starting scheduling...');

        try {
            const baseTime = new Date(scheduleTime).getTime();

            for (let i = 0; i < quotes.length; i++) {
                setScheduleProgress(`Generating video ${i + 1}/${quotes.length}...`);
                const blob = await generateVideoBlob(quotes[i]);

                if (!blob) continue;

                setScheduleProgress(`Uploading video ${i + 1}/${quotes.length}...`);
                const publishTime = new Date(baseTime + (i * scheduleInterval * 60 * 1000));

                const formData = new FormData();
                formData.append('video', blob, `quote-${i}.webm`); // Fixed: Use correct extension
                // Create viral title for Shorts
                const quotePreview = quotes[i].text.substring(0, 45);
                const viralTitle = `${quotePreview}... 🔥 #shorts #quotes #${quotes[i].category}`;

                // Create trending description with viral hashtags
                const viralDescription = `${quotes[i].text}\n\n- ${quotes[i].author}\n\n🔥 FOLLOW FOR MORE DAILY QUOTES! 🔥\n\n#shorts #quotes #motivation #inspiration #success #mindset #viral #trending #fyp #foryou #wisdom #dailyquotes #motivationalquotes #inspirationalquotes #${quotes[i].category} #shortsvideo #youtubeshorts #viralshorts #quotesoftheday #lifequotes`;

                // Viral tags for better discoverability
                const viralTags = [
                    'shorts',
                    'quotes',
                    'motivation',
                    'inspiration',
                    'success',
                    'mindset',
                    'viral',
                    'trending',
                    'fyp',
                    'wisdom',
                    'daily quotes',
                    'motivational quotes',
                    'inspirational quotes',
                    quotes[i].category,
                    'youtube shorts',
                    'viral shorts',
                    'quotes of the day',
                    'life quotes',
                    'positive vibes',
                    'self improvement'
                ];

                formData.append('title', viralTitle);
                formData.append('description', viralDescription);
                formData.append('tags', JSON.stringify(viralTags));
                formData.append('publishAt', publishTime.toISOString());
                if (selectedAccountId) {
                    formData.append('accountId', selectedAccountId);
                }

                const res = await fetch('/api/youtube/upload-video', {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    console.error(`Failed to upload video ${i + 1}`);
                }
            }
            setScheduleProgress('All videos scheduled successfully!');
            setTimeout(() => setScheduleProgress(''), 3000);
        } catch (error) {
            console.error('Scheduling error:', error);
            setScheduleProgress('Error during scheduling');
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <div className="space-y-8">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
            />
            <input
                type="file"
                ref={audioInputRef}
                onChange={handleAudioUpload}
                className="hidden"
                accept="audio/*"
            />

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 border border-purple-500/30 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30">
                            <Sparkles className="text-white" size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Quotes Studio</h1>
                            <p className="text-purple-200 text-sm mt-1">Create stunning quote videos in seconds</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Quote Generation */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] backdrop-blur-xl p-6 rounded-2xl border border-[#333] shadow-xl">
                        <div className="flex items-center gap-2 mb-5">
                            <Sparkles className="text-purple-400" size={20} />
                            <h2 className="text-lg font-bold text-white">Content</h2>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">Topic</label>
                                <input
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Success, Mindset, Love..."
                                    className="w-full bg-black/40 border border-[#333] rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">Vibe</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setStyle(s)}
                                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${style === s
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                                : 'bg-black/40 text-gray-400 border border-[#333] hover:border-[#444] hover:text-gray-300'
                                                }`}
                                        >
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">
                                    Quantity <span className="text-purple-400 font-mono ml-2">{quoteCount}</span>
                                </label>
                                <div className="bg-black/40 border border-[#333] rounded-xl px-4 py-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={quoteCount}
                                        onChange={(e) => setQuoteCount(parseInt(e.target.value))}
                                        className="w-full accent-purple-500 h-2 bg-[#333] rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(quoteCount / 50) * 100}%, rgb(51, 51, 51) ${(quoteCount / 50) * 100}%, rgb(51, 51, 51) 100%)`
                                        }}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !topic}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={20} />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} />
                                        Generate {quoteCount} Quote{quoteCount > 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Preview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] backdrop-blur-xl p-6 rounded-2xl border border-[#333] shadow-xl">
                        <div className="flex items-center gap-2 mb-5">
                            <Monitor className="text-blue-400" size={20} />
                            <h2 className="text-lg font-bold text-white">Live Preview</h2>
                        </div>

                        <div className="flex justify-center">
                            <div
                                className={`relative overflow-hidden rounded-2xl border-2 border-[#444] shadow-2xl transition-all duration-500 ${aspectRatio === 'story' ? 'aspect-[9/16] w-56' : 'aspect-square w-full max-w-sm'
                                    }`}
                            >
                                {/* Preview Background */}
                                <div className="absolute inset-0 z-0">
                                    {backgroundType === 'image' && backgroundImage ? (
                                        <>
                                            <img src={backgroundImage} alt="bg" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60" />
                                        </>
                                    ) : (
                                        <div
                                            className="w-full h-full"
                                            style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }}
                                        />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 z-10 p-6 flex flex-col justify-center items-center text-center">
                                    <Sparkles className="text-white/40 mb-3 animate-pulse" size={20} />
                                    <p
                                        className="text-white font-bold leading-relaxed mb-4 drop-shadow-2xl"
                                        style={{
                                            color: textColor,
                                            textAlign: textAlign,
                                            fontSize: `${(aspectRatio === 'story' ? 1.1 : 1.2) * fontSizeScale}rem`
                                        }}
                                    >
                                        "Your amazing quote will appear here."
                                    </p>
                                    <div className="h-0.5 w-8 bg-white/30 mb-3 rounded-full" />
                                    <p className="text-white/90 text-sm font-medium italic drop-shadow-lg">
                                        - Preview Author
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Format Selection */}
                        <div className="mt-6">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">Format</label>
                            <div className="grid grid-cols-2 gap-2 bg-black/40 rounded-xl p-1.5 border border-[#333]">
                                <button
                                    onClick={() => setAspectRatio('square')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${aspectRatio === 'square'
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <Monitor size={16} /> Square
                                </button>
                                <button
                                    onClick={() => setAspectRatio('story')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${aspectRatio === 'story'
                                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <Smartphone size={16} /> Reels
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Customization */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Background Settings */}
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] backdrop-blur-xl p-6 rounded-2xl border border-[#333] shadow-xl">
                        <div className="flex items-center gap-2 mb-5">
                            <Palette className="text-pink-400" size={20} />
                            <h2 className="text-lg font-bold text-white">Background</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setBackgroundType('gradient')}
                                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 transition-all text-sm font-semibold ${backgroundType === 'gradient'
                                        ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                                        : 'border-[#333] bg-black/40 text-gray-400 hover:border-[#444]'
                                        }`}
                                >
                                    <Palette size={16} /> Gradient
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 transition-all text-sm font-semibold ${backgroundType === 'image'
                                        ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                                        : 'border-[#333] bg-black/40 text-gray-400 hover:border-[#444]'
                                        }`}
                                >
                                    <ImageIcon size={16} /> Image
                                </button>
                            </div>

                            {backgroundType === 'gradient' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-black/40 p-3 rounded-xl border border-[#333] flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={color1}
                                            onChange={(e) => setColor1(e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-[#444]"
                                        />
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500 mb-1">Color 1</div>
                                            <div className="text-sm text-white font-mono">{color1}</div>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-xl border border-[#333] flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={color2}
                                            onChange={(e) => setColor2(e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-[#444]"
                                        />
                                        <div className="flex-1">
                                            <div className="text-xs text-gray-500 mb-1">Color 2</div>
                                            <div className="text-sm text-white font-mono">{color2}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {backgroundType === 'image' && backgroundImage && (
                                <div className="bg-black/40 p-3 rounded-xl border border-[#333] text-center">
                                    <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                                        <ImageIcon size={14} /> Image uploaded
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Styling */}
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] backdrop-blur-xl p-6 rounded-2xl border border-[#333] shadow-xl">
                        <div className="flex items-center gap-2 mb-5">
                            <Type className="text-cyan-400" size={20} />
                            <h2 className="text-lg font-bold text-white">Text Style</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Color */}
                            <div className="bg-black/40 p-3 rounded-xl border border-[#333]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Color</span>
                                    <span className="text-xs font-mono text-gray-500">{textColor}</span>
                                </div>
                                <input
                                    type="color"
                                    value={textColor}
                                    onChange={(e) => setTextColor(e.target.value)}
                                    className="w-full h-10 rounded-lg cursor-pointer border-2 border-[#444]"
                                />
                            </div>

                            {/* Alignment */}
                            <div className="bg-black/40 p-3 rounded-xl border border-[#333]">
                                <div className="text-xs font-bold text-gray-400 uppercase mb-3">Alignment</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'left', icon: AlignLeft, label: 'Left' },
                                        { id: 'center', icon: AlignCenter, label: 'Center' },
                                        { id: 'right', icon: AlignRight, label: 'Right' }
                                    ].map(({ id, icon: Icon, label }) => (
                                        <button
                                            key={id}
                                            onClick={() => setTextAlign(id as any)}
                                            className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-all ${textAlign === id
                                                ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500'
                                                : 'bg-black/40 text-gray-500 border-2 border-transparent hover:text-gray-300'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span className="text-xs font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size */}
                            <div className="bg-black/40 p-3 rounded-xl border border-[#333]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Size</span>
                                    <span className="text-sm font-mono text-white bg-black/60 px-3 py-1 rounded-lg">{Math.round(fontSizeScale * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setFontSizeScale(prev => Math.max(0.6, prev - 0.1))}
                                        className="p-2 bg-black/60 hover:bg-black/80 text-gray-400 hover:text-white rounded-lg transition-all border border-[#444]"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <div className="flex-1 h-2 bg-[#333] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                                            style={{ width: `${((fontSizeScale - 0.6) / (2.0 - 0.6)) * 100}%` }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setFontSizeScale(prev => Math.min(2.0, prev + 0.1))}
                                        className="p-2 bg-black/60 hover:bg-black/80 text-gray-400 hover:text-white rounded-lg transition-all border border-[#444]"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Audio / Music Selection */}
                    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] backdrop-blur-xl p-6 rounded-2xl border border-[#333] shadow-xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Music className="text-green-400" size={20} />
                            <h2 className="text-lg font-bold text-white">Music</h2>
                        </div>

                        {/* Music Source Toggle */}
                        <div className="grid grid-cols-2 gap-2 mb-4 bg-black/40 rounded-xl p-1.5 border border-[#333]">
                            <button
                                onClick={() => setUseLibraryMusic(true)}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${useLibraryMusic
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Music size={16} /> Library
                            </button>
                            <button
                                onClick={() => setUseLibraryMusic(false)}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${!useLibraryMusic
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Upload size={16} /> Upload
                            </button>
                        </div>

                        {useLibraryMusic ? (
                            <>
                                {/* Mood Filter */}
                                {musicLibrary && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-400 uppercase">Mood</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {musicLibrary.moods.map((mood) => (
                                                <button
                                                    key={mood.id}
                                                    onClick={() => setSelectedMood(mood.id)}
                                                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedMood === mood.id
                                                        ? 'bg-green-500/20 text-green-300 border-2 border-green-500'
                                                        : 'bg-black/40 text-gray-400 border-2 border-transparent hover:text-gray-300'
                                                        }`}
                                                >
                                                    <span>{mood.icon}</span>
                                                    <span>{mood.name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Track Selection */}
                                        <div className="mt-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Select Track</label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {musicLibrary.tracks
                                                    .filter(track => track.mood === selectedMood)
                                                    .map((track) => (
                                                        <button
                                                            key={track.id}
                                                            onClick={() => handleTrackSelect(track)}
                                                            className={`w-full text-left p-3 rounded-lg transition-all ${selectedTrack?.id === track.id
                                                                ? 'bg-green-500/20 border-2 border-green-500'
                                                                : 'bg-black/40 border-2 border-[#333] hover:border-[#444]'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className={`text-sm font-semibold ${selectedTrack?.id === track.id ? 'text-green-300' : 'text-white'
                                                                        }`}>
                                                                        {track.name}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500 mt-1">{track.description}</div>
                                                                </div>
                                                                {selectedTrack?.id === track.id && (
                                                                    <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Audio Preview */}
                                        {selectedTrack && (
                                            <div className="mt-4 bg-black/40 p-3 rounded-xl border border-[#333]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="text-xs text-gray-400">Now Playing</div>
                                                        <div className="text-sm font-semibold text-white">{selectedTrack.name}</div>
                                                    </div>
                                                    <button
                                                        onClick={togglePreview}
                                                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all"
                                                    >
                                                        {isPlayingPreview ? <Pause size={16} /> : <Play size={16} />}
                                                    </button>
                                                </div>
                                                <audio
                                                    ref={audioPreviewRef}
                                                    src={getTrackUrl(selectedTrack.filename)}
                                                    onEnded={() => setIsPlayingPreview(false)}
                                                    className="hidden"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <button
                                onClick={() => audioInputRef.current?.click()}
                                className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all group ${audioFile
                                    ? 'border-green-500 bg-green-500/20 text-green-300'
                                    : 'border-[#333] bg-black/40 text-gray-400 hover:border-[#444]'
                                    }`}
                            >
                                <span className="flex items-center gap-3 text-sm font-semibold">
                                    <Music size={18} className={audioFile ? "text-green-400" : "text-gray-500"} />
                                    {audioFile ? audioFile.name : 'Upload Background Music'}
                                </span>
                                {!audioFile && <Upload size={16} className="opacity-50 group-hover:opacity-100" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Scheduling Section */}
            {quotes.length > 0 && (
                <div className="bg-gradient-to-br from-blue-600/10 via-cyan-600/10 to-purple-600/10 backdrop-blur-xl p-8 rounded-2xl border border-blue-500/30 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/30">
                            <Calendar className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Schedule Posting</h2>
                            <p className="text-blue-200 text-sm mt-1">Automate your YouTube Shorts uploads</p>
                        </div>
                    </div>

                    {/* YouTube Account Selector */}
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">
                            YouTube Account
                        </label>
                        {youtubeAccounts.length > 0 ? (
                            <select
                                value={selectedAccountId || ''}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="w-full bg-black/40 border border-[#333] rounded-xl px-4 py-3.5 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                            >
                                {youtubeAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                        {account.channelName} {account.isActive ? '(Active)' : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="bg-black/40 border border-[#333] rounded-xl px-4 py-3.5 flex items-center gap-3">
                                <Youtube className="text-red-500" size={20} />
                                <span className="text-gray-400 text-sm">No YouTube accounts connected</span>
                                <a
                                    href="/settings"
                                    className="ml-auto text-red-500 hover:text-red-400 text-sm font-semibold"
                                >
                                    Connect
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">Start Time</label>
                            <input
                                type="datetime-local"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="w-full bg-black/40 border border-[#333] rounded-xl px-4 py-3.5 text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 block">Interval (Minutes)</label>
                            <div className="flex items-center gap-3 bg-black/40 border border-[#333] rounded-xl px-4 py-3.5">
                                <Clock size={18} className="text-gray-500" />
                                <input
                                    type="number"
                                    min="1"
                                    value={scheduleInterval}
                                    onChange={(e) => setScheduleInterval(parseInt(e.target.value))}
                                    className="w-full bg-transparent text-white outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleSchedule}
                                disabled={isScheduling || !scheduleTime}
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isScheduling ? scheduleProgress : `Schedule ${quotes.length} Video${quotes.length > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quotes Grid Output */}
            {quotes.length > 0 && (
                <>
                    <div className="flex items-center justify-between pt-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Generated Quotes</h2>
                            <p className="text-gray-400 text-sm mt-1">{quotes.length} quote{quotes.length > 1 ? 's' : ''} ready to download</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {quotes.map((quote, index) => (
                            <div
                                key={index}
                                className={`relative group overflow-hidden rounded-2xl border-2 border-[#333] transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] ${aspectRatio === 'story' ? 'aspect-[9/16]' : 'aspect-square'
                                    }`}
                            >
                                {/* Preview Background */}
                                <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110">
                                    {backgroundType === 'image' && backgroundImage ? (
                                        <>
                                            <img src={backgroundImage} alt="bg" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60" />
                                        </>
                                    ) : (
                                        <div
                                            className="w-full h-full"
                                            style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }}
                                        />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="absolute inset-0 z-10 p-8 flex flex-col justify-center items-center text-center">
                                    <Sparkles className="text-white/30 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500" size={24} />
                                    <p
                                        className="text-white font-bold leading-relaxed mb-6 drop-shadow-2xl"
                                        style={{
                                            color: textColor,
                                            textAlign: textAlign,
                                            fontSize: `${(aspectRatio === 'story' ? 1.5 : 1.25) * fontSizeScale}rem`
                                        }}
                                    >
                                        "{quote.text}"
                                    </p>
                                    <div className="h-0.5 w-12 bg-white/30 mb-6 rounded-full" />
                                    <p className="text-white/90 text-sm md:text-base font-medium italic drop-shadow-lg">
                                        - {quote.author}
                                    </p>
                                </div>

                                {/* Actions Overlay */}
                                <div className="absolute inset-0 z-20 bg-gradient-to-br from-black/90 via-purple-900/40 to-black/90 flex flex-col justify-center items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                                    <button
                                        onClick={() => downloadImage(quote, index)}
                                        className="w-60 bg-white text-black hover:bg-gray-100 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 transform hover:scale-105 shadow-xl"
                                    >
                                        <Download size={18} />
                                        Download Image
                                    </button>
                                    <button
                                        onClick={() => downloadVideo(quote, index)}
                                        className="w-60 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 transform hover:scale-105 shadow-xl shadow-purple-500/40"
                                    >
                                        <Video size={18} />
                                        Download 30s Video
                                    </button>
                                    {(useLibraryMusic && selectedTrack) || audioFile ? (
                                        <div className="flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-full border border-green-500/30 text-xs font-semibold">
                                            <Music size={14} />
                                            {useLibraryMusic && selectedTrack ? selectedTrack.name : 'Custom Audio'}
                                        </div>
                                    ) : null}
                                </div>

                                {/* Quote Number Badge */}
                                <div className="absolute top-3 right-3 z-30 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20">
                                    #{index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
