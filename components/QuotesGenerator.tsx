"use client";

import { useState, useRef } from "react";
import { Sparkles, Download, Share2, RefreshCw, Smartphone, Monitor, Image as ImageIcon, Palette, Video } from "lucide-react";

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

    // Formatting State
    const [aspectRatio, setAspectRatio] = useState<'square' | 'story'>('story'); // Default to story (9:16)
    const [backgroundType, setBackgroundType] = useState<'gradient' | 'image'>('gradient');
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [gradient, setGradient] = useState('linear-gradient(to bottom right, #667eea, #764ba2)');

    // Refs for file input
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/quotes/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, count: 9, style })
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

    const drawCanvas = async (canvas: HTMLCanvasElement, quote: Quote) => {
        const ctx = canvas.getContext('2d')!;
        const width = canvas.width;
        const height = canvas.height;

        // Draw Background
        if (backgroundType === 'image' && backgroundImage) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = backgroundImage;
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Fallback if image fails
            });

            // Cover fit
            const scale = Math.max(width / img.width, height / img.height);
            const x = (width / 2) - (img.width / 2) * scale;
            const y = (height / 2) - (img.height / 2) * scale;
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // Dark overlay for readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, width, height);
        } else {
            // Gradient
            const grad = ctx.createLinearGradient(0, 0, width, height);
            // Simple parsing of current gradient or default
            grad.addColorStop(0, '#667eea');
            grad.addColorStop(1, '#764ba2');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }

        // Configuration
        ctx.fillStyle = '#ffffff';
        const fontSize = width === 1080 ? 60 : 40; // Adjust for size
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

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

        // Draw lines centered vertically
        const lineHeight = fontSize * 1.4;
        const totalHeight = lines.length * lineHeight;
        const startY = (height / 2) - (totalHeight / 2);

        lines.forEach((line, i) => {
            ctx.fillText(line, width / 2, startY + i * lineHeight);
        });

        // Author
        ctx.font = `italic ${fontSize * 0.7}px Arial`;
        ctx.fillText(`- ${quote.author}`, width / 2, startY + totalHeight + 40);

        // Watermark (optional)
        ctx.font = `20px Arial`;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('AgentX Quotes', width / 2, height - 50);
    };

    const downloadImage = async (quote: Quote, index: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = aspectRatio === 'story' ? 1920 : 1080;

        await drawCanvas(canvas, quote);

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

    const downloadVideo = async (quote: Quote, index: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = aspectRatio === 'story' ? 1920 : 1080;

        await drawCanvas(canvas, quote);

        const stream = canvas.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9' // Most browser support this, we'll save as .mp4
        });

        const chunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quote-video-${index + 1}.mp4`;
            a.click();
            URL.revokeObjectURL(url);
        };

        mediaRecorder.start();

        // Record for 10 seconds
        // To make it video-like, we could animate, but for now static image video
        // We need to keep the event loop alive or just wait
        let frameCount = 0;
        const maxFrames = 30 * 10; // 10 seconds * 30 fps

        const animate = () => {
            if (frameCount < maxFrames) {
                // Just redraw or request frame to keep stream active
                // For static canvas, captureStream handles it, but sometimes needs 'help'
                const ctx = canvas.getContext('2d')!;
                // Subtle zoom or movement could go here

                requestAnimationFrame(animate);
                frameCount++;
            } else {
                mediaRecorder.stop();
            }
        };
        animate();

        // Hard stop backup
        setTimeout(() => {
            if (mediaRecorder.state === 'recording') mediaRecorder.stop();
        }, 10500);
    };

    return (
        <div className="space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
            />

            {/* Input & Controls Section */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 rounded-2xl border border-[#333]">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Sparkles className="text-purple-500" />
                    Generate Quotes
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Left: Input */}
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-400">Topic</label>
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter topic (e.g., 'Success', 'Motivation')..."
                            className="w-full bg-[#000] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        />

                        <div className="flex gap-2">
                            {(['inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                                <button
                                    key={s}
                                    onClick={() => setStyle(s)}
                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${style === s
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-[#333] text-[#71767b] hover:bg-[#444]'
                                        }`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Customization */}
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-400">Settings</label>

                        {/* Aspect Ratio */}
                        <div className="flex bg-[#333] rounded-lg p-1">
                            <button
                                onClick={() => setAspectRatio('square')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${aspectRatio === 'square' ? 'bg-[#000] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Monitor size={16} /> Square
                            </button>
                            <button
                                onClick={() => setAspectRatio('story')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${aspectRatio === 'story' ? 'bg-[#000] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Smartphone size={16} /> Reels (9:16)
                            </button>
                        </div>

                        {/* Background Toggle */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setBackgroundType('gradient')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${backgroundType === 'gradient' ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-[#333] text-gray-400 hover:bg-[#333]'}`}
                            >
                                <Palette size={18} /> Colors
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${backgroundType === 'image' ? 'border-purple-500 text-purple-400 bg-purple-500/10' : 'border-[#333] text-gray-400 hover:bg-[#333]'}`}
                            >
                                <ImageIcon size={18} /> {backgroundImage ? 'Change Image' : 'Upload Image'}
                            </button>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !topic}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99]"
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw className="animate-spin" size={24} />
                            Creating Magic...
                        </>
                    ) : (
                        <>
                            <Sparkles size={24} />
                            Generate Quotes
                        </>
                    )}
                </button>
            </div>

            {/* Quotes Grid */}
            {quotes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotes.map((quote, index) => (
                        <div
                            key={index}
                            className={`relative group overflow-hidden rounded-2xl border border-purple-500/20 transition-all hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/10 ${aspectRatio === 'story' ? 'aspect-[9/16]' : 'aspect-square'}`}
                        >
                            {/* Preview Background */}
                            <div className="absolute inset-0 z-0">
                                {backgroundType === 'image' && backgroundImage ? (
                                    <>
                                        <img src={backgroundImage} alt="bg" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60" />
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#667eea] to-[#764ba2]" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 z-10 p-6 flex flex-col justify-center items-center text-center">
                                <p className="text-white text-xl md:text-2xl font-bold leading-relaxed mb-6 drop-shadow-lg">
                                    "{quote.text}"
                                </p>
                                <p className="text-purple-200 text-base md:text-lg font-medium tracking-wide">
                                    - {quote.author}
                                </p>
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 z-20 bg-black/80 flex flex-col justify-center items-center gap-4 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                                <button
                                    onClick={() => downloadImage(quote, index)}
                                    className="w-48 bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                                >
                                    <Download size={18} />
                                    Save Image
                                </button>
                                <button
                                    onClick={() => downloadVideo(quote, index)}
                                    className="w-48 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                                >
                                    <Video size={18} />
                                    Save Video (MP4)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
