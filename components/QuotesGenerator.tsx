"use client";

import { useState, useRef } from "react";
import { Sparkles, Download, Share2, RefreshCw, Smartphone, Monitor, Image as ImageIcon, Palette, Video, Music, Upload, Type } from "lucide-react";

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

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);

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

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
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
        ctx.fillStyle = '#ffffff';
        const isStory = width === 1080 && height === 1920;
        const fontSize = isStory ? 64 : 50;
        ctx.font = `bold ${fontSize}px "Inter", Arial, sans-serif`;
        ctx.textAlign = 'center';
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

        // 3. Draw Quote Text (Centered)
        const lineHeight = fontSize * 1.4;
        const totalHeight = lines.length * lineHeight;
        const startY = (height / 2) - (totalHeight / 2);

        // Subtle Float Animation for text
        const floatY = Math.sin(time / 2000) * 10;

        lines.forEach((line, i) => {
            ctx.fillText(line, width / 2, startY + i * lineHeight + floatY);
        });

        // 4. Draw Author
        ctx.font = `italic ${fontSize * 0.6}px "Inter", Arial, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText(`- ${quote.author}`, width / 2, startY + totalHeight + 40 + floatY);

        // 5. Draw Watermark/Brand
        ctx.font = `500 24px "Inter", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 0; // Remove shadow for watermark
        ctx.fillText('AgentX Quotes', width / 2, height - 80);
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

    const downloadVideo = async (quote: Quote, index: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = aspectRatio === 'story' ? 1920 : 1080;

        // Audio Setup
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const dest = audioContext.createMediaStreamDestination();

        if (audioFile) {
            try {
                const arrayBuffer = await audioFile.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(dest);
                source.loop = true; // Loop audio if shorter than 10s
                source.start();
            } catch (err) {
                console.error("Audio processing failed", err);
            }
        }

        const canvasStream = canvas.captureStream(30); // 30 FPS

        // Add audio track if available
        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
            canvasStream.addTrack(audioTrack);
        }

        const mediaRecorder = new MediaRecorder(canvasStream, {
            mimeType: 'video/webm;codecs=vp9', // Ideally use 'video/mp4' if supported by browser, else fallback
            videoBitsPerSecond: 8000000 // High bitrate for quality
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
            audioContext.close();
        };

        mediaRecorder.start();

        const duration = 10000; // 10 seconds
        const startTime = Date.now();

        // Animation Loop
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
            <input
                type="file"
                ref={audioInputRef}
                onChange={handleAudioUpload}
                className="hidden"
                accept="audio/*"
            />

            {/* Main Control Panel */}
            <div className="bg-[#111] bg-opacity-80 backdrop-blur-xl p-8 rounded-3xl border border-[#333] shadow-2xl">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Left Column: Quote Generation */}
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/20">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Generate Quotes</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Topic</label>
                                <input
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Enter a topic (e.g., 'Success', 'Mindset')..."
                                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-5 py-4 text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-lg"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Vibe</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setStyle(s)}
                                            className={`py-3 rounded-xl font-medium text-sm transition-all border ${style === s
                                                ? 'bg-white text-black border-white shadow-lg'
                                                : 'bg-[#1a1a1a] text-gray-400 border-[#333] hover:bg-[#222] hover:border-[#444]'
                                                }`}
                                        >
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Style & Media Settings */}
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-[#222] rounded-lg border border-[#333]">
                                <Palette className="text-purple-400" size={20} />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Studio Settings</h2>
                        </div>

                        <div className="space-y-5">
                            {/* Format Selection */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Format</label>
                                <div className="flex bg-[#1a1a1a] rounded-xl p-1 border border-[#333]">
                                    <button
                                        onClick={() => setAspectRatio('square')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${aspectRatio === 'square' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        <Monitor size={16} /> Square
                                    </button>
                                    <button
                                        onClick={() => setAspectRatio('story')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${aspectRatio === 'story' ? 'bg-[#333] text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        <Smartphone size={16} /> Reels (9:16)
                                    </button>
                                </div>
                            </div>

                            {/* Background Selection */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Background</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setBackgroundType('gradient')}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-medium ${backgroundType === 'gradient' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' : 'border-[#333] bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'}`}
                                        >
                                            <Palette size={16} /> Colors
                                        </button>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all text-sm font-medium ${backgroundType === 'image' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' : 'border-[#333] bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'}`}
                                        >
                                            <ImageIcon size={16} /> {backgroundImage ? 'Change Image' : 'Upload Image'}
                                        </button>
                                    </div>

                                    {/* Color Pickers (Conditional) */}
                                    {backgroundType === 'gradient' && (
                                        <div className="flex gap-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex-1 bg-[#1a1a1a] p-2 rounded-xl border border-[#333] flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={color1}
                                                    onChange={(e) => setColor1(e.target.value)}
                                                    className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                                />
                                                <span className="text-xs text-gray-400 font-mono">{color1}</span>
                                            </div>
                                            <div className="flex-1 bg-[#1a1a1a] p-2 rounded-xl border border-[#333] flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={color2}
                                                    onChange={(e) => setColor2(e.target.value)}
                                                    className="w-8 h-8 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                                                />
                                                <span className="text-xs text-gray-400 font-mono">{color2}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Audio Selection */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Audio</label>
                                <button
                                    onClick={() => audioInputRef.current?.click()}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm group ${audioFile ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-[#333] bg-[#1a1a1a] text-gray-400 hover:bg-[#222]'}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <Music size={16} className={audioFile ? "text-green-500" : "text-gray-500"} />
                                        {audioFile ? audioFile.name : 'Select Background Song (MP3)'}
                                    </span>
                                    {!audioFile && <Upload size={14} className="opacity-50 group-hover:opacity-100" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !topic}
                    className="w-full mt-8 bg-white text-black hover:bg-gray-100 font-bold py-4 rounded-xl transition-all shadow-lg shadow-white/10 disabled:opacity-50 flex items-center justify-center gap-3 text-lg transform hover:scale-[1.01] active:scale-[0.99]"
                >
                    {isGenerating ? (
                        <>
                            <RefreshCw className="animate-spin" size={24} />
                            Creating Magic...
                        </>
                    ) : (
                        <>
                            <Sparkles size={24} className="text-purple-600" />
                            Generate Quotes
                        </>
                    )}
                </button>
            </div>

            {/* Quotes Grid Output */}
            {quotes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    {quotes.map((quote, index) => (
                        <div
                            key={index}
                            className={`relative group overflow-hidden rounded-3xl border border-[#333] transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 ${aspectRatio === 'story' ? 'aspect-[9/16]' : 'aspect-square'}`}
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
                                        style={{ background: `linear-gradient(to bottom right, ${color1}, ${color2})` }}
                                    />
                                )}
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 z-10 p-8 flex flex-col justify-center items-center text-center">
                                <Sparkles className="text-white/30 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500" size={24} />
                                <p className="text-white text-xl md:text-2xl font-bold leading-relaxed mb-6 drop-shadow-lg tracking-tight">
                                    "{quote.text}"
                                </p>
                                <div className="h-0.5 w-12 bg-white/20 mb-6 rounded-full" />
                                <p className="text-white/90 text-sm md:text-base font-medium tracking-wide italic">
                                    - {quote.author}
                                </p>
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute inset-0 z-20 bg-black/80 flex flex-col justify-center items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-md">
                                <button
                                    onClick={() => downloadImage(quote, index)}
                                    className="w-56 bg-white text-black hover:bg-gray-200 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                                >
                                    <Download size={18} />
                                    Save Image
                                </button>
                                <button
                                    onClick={() => downloadVideo(quote, index)}
                                    className={`w-56 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 transform hover:scale-105 shadow-lg shadow-purple-500/25`}
                                >
                                    <Video size={18} />
                                    Save 10s Video
                                </button>
                                {audioFile && (
                                    <p className="text-green-400 text-xs font-semibold flex items-center gap-1.5 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                                        <Music size={12} /> Sound On
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
