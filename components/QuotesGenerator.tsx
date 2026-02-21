"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Download, Share2, RefreshCw, Smartphone, Monitor, Image as ImageIcon, Palette, Video, Music, Upload, Type, AlignLeft, AlignCenter, AlignRight, Minus, Plus, Calendar, Clock, Play, Pause, Youtube, Rocket, Terminal, Loader2, ChevronDown } from "lucide-react";
import { MusicLibrary, MusicTrack, getTrackUrl, fetchTrackAsBlob } from "@/lib/music-library";

interface Decoration {
    image: string;
    x: number; // 0-1 range
    y: number; // 0-1 range
    size: number; // 0.15-0.5 range (relative to canvas width)
}

interface Quote {
    text: string;
    author: string;
    category: string;
    decorations: Decoration[]; // Array of decorations (0-5 items)
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
    const [color1, setColor1] = useState('#000000');
    const [color2, setColor2] = useState('#000000');
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
    const [fontSizeScale, setFontSizeScale] = useState(0.6); // 0.8 to 1.5

    // Scheduling & Batch State
    const [quoteCount, setQuoteCount] = useState(1);
    const [isScheduling, setIsScheduling] = useState(false);
    const [scheduleProgress, setScheduleProgress] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [scheduleInterval, setScheduleInterval] = useState(60); // minutes
    const [videoDuration, setVideoDuration] = useState(10); // seconds (5-15)
    const [isSuggesting, setIsSuggesting] = useState(false);

    // YouTube Account State
    const [youtubeAccounts, setYoutubeAccounts] = useState<any[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

    // Graphics Decorator State
    const [availableGraphics, setAvailableGraphics] = useState<string[]>([]);


    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const audioPreviewRef = useRef<HTMLAudioElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null); // For batch logs

    // Batch Automation State
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [batchLogs, setBatchLogs] = useState<string[]>([]);
    const [livePreviewQuote, setLivePreviewQuote] = useState<Quote | null>(null);
    const livePreviewCanvasRef = useRef<HTMLCanvasElement>(null);

    // Auto-Pilot Configuration State
    const [autoPilotStyle, setAutoPilotStyle] = useState<'random' | 'inspirational' | 'funny' | 'wisdom' | 'success'>('random');
    const [autoPilotGenerationsPerChannel, setAutoPilotGenerationsPerChannel] = useState(1);
    const [autoPilotBackgroundType, setAutoPilotBackgroundType] = useState<'random' | 'gradient' | 'image'>('random');
    const [autoPilotTextAlign, setAutoPilotTextAlign] = useState<'random' | 'left' | 'center' | 'right'>('random');
    const [showAutoPilotSettings, setShowAutoPilotSettings] = useState(false);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [batchLogs]);

    const addBatchLog = (msg: string) => {
        setBatchLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

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

        async function loadGraphics() {
            try {
                const response = await fetch('/api/graphics/list');
                const data = await response.json();
                if (data.graphics) {
                    setAvailableGraphics(data.graphics);
                }
            } catch (error) {
                console.error('Failed to load graphics:', error);
            }
        }

        loadMusicLibrary();
        loadYouTubeAccounts();
        loadGraphics();
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
                // Enhance quotes with random decorations and positions
                const enhancedQuotes = data.quotes.map((q: Quote) => {
                    const decorations: Decoration[] = [];

                    if (availableGraphics.length > 0) {
                        // Random number of decorations (0-5)
                        const numDecorations = Math.floor(Math.random() * 6); // 0, 1, 2, 3, 4, or 5

                        for (let i = 0; i < numDecorations; i++) {
                            // Pick a random graphic
                            const randomGraphic = availableGraphics[Math.floor(Math.random() * availableGraphics.length)];

                            // Random position (anywhere on canvas)
                            const x = Math.random(); // 0-1
                            const y = Math.random(); // 0-1

                            // Random size (15% to 50% of canvas width)
                            const size = 0.15 + Math.random() * 0.35;

                            decorations.push({
                                image: randomGraphic,
                                x,
                                y,
                                size
                            });
                        }
                    }

                    return {
                        ...q,
                        decorations
                    };
                });
                setQuotes(enhancedQuotes);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSuggestTopic = async () => {
        setIsSuggesting(true);
        try {
            const res = await fetch("/api/quotes/suggest-trends", {
                method: "POST"
            });
            const data = await res.json();
            if (data.topics && data.topics.length > 0) {
                // Pick a random topic from the suggestions
                const randomTopic = data.topics[Math.floor(Math.random() * data.topics.length)];
                setTopic(randomTopic);
            }
        } catch (error) {
            console.error("Failed to suggest topic:", error);
        } finally {
            setIsSuggesting(false);
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

    const prepareDecoration = async (url: string): Promise<HTMLCanvasElement | null> => {
        if (!url) return null;
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = url;

            if (!img.complete) {
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue on error to avoid hanging
                });
            }

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;

            ctx.drawImage(img, 0, 0);
            return canvas;
        } catch (error) {
            console.error('Failed to prepare decoration:', error);
            return null;
        }
    };


    interface RenderConfig {
        backgroundType: 'gradient' | 'image' | 'mesh' | 'cinematic';
        backgroundImage: string | null;
        color1: string;
        color2: string;
        color3?: string; // For mesh
        textColor: string;
        textAlign: 'left' | 'center' | 'right';
        fontSizeScale: number;
        showParticles?: boolean;
        typewriterEffect?: boolean;
    }

    /**
     * Draws a single frame to the canvas.
     * @param canvas The canvas element
     * @param quote The quote to draw
     * @param time The current animation time in ms
     * @param preparedDecorations Optional pre-loaded decoration canvases [d1, d2]
     * @param config Optional configuration to override state (for batch processing)
     */
    const drawCanvas = async (canvas: HTMLCanvasElement, quote: Quote, time: number = 0, preparedDecorations: (HTMLCanvasElement | null)[] = [], config?: RenderConfig) => {
        const ctx = canvas.getContext('2d')!;
        const width = canvas.width;
        const height = canvas.height;

        // Use config if provided, otherwise use state
        const cfgBackgroundType = config ? config.backgroundType : (backgroundType as any);
        const cfgBackgroundImage = config ? config.backgroundImage : backgroundImage;
        const cfgColor1 = config ? config.color1 : color1;
        const cfgColor2 = config ? config.color2 : color2;
        const cfgColor3 = config ? (config.color3 || '#4f46e5') : '#4f46e5';
        const cfgTextColor = config ? config.textColor : textColor;
        const cfgTextAlign = config ? config.textAlign : textAlign;
        const cfgFontSizeScale = config ? config.fontSizeScale : fontSizeScale;
        const showParticles = config ? config.showParticles : true;

        ctx.clearRect(0, 0, width, height);

        // Animation factors
        const progress = Math.min(time / 10000, 1);
        const zoom = 1 + (progress * 0.1);

        // 1. Draw Background
        if (cfgBackgroundType === 'image' && cfgBackgroundImage) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = cfgBackgroundImage;

            if (!img.complete) {
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });
            }

            const scale = Math.max(width / img.width, height / img.height) * zoom;
            const x = (width / 2) - (img.width / 2) * scale;
            const y = (height / 2) - (img.height / 2) * scale;

            ctx.save();
            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            ctx.restore();

            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 0, width, height);
        } else if (cfgBackgroundType === 'mesh') {
            // Animated Mesh Gradient
            const t = time / 3000;
            const grad = ctx.createRadialGradient(
                width / 2 + Math.cos(t) * width * 0.3,
                height / 2 + Math.sin(t) * height * 0.3,
                0,
                width / 2,
                height / 2,
                width
            );
            grad.addColorStop(0, cfgColor1);
            grad.addColorStop(0.5, cfgColor2);
            grad.addColorStop(1, cfgColor3);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // Subtle moving highlight
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + Math.sin(t) * 0.02})`;
            ctx.beginPath();
            ctx.arc(width * 0.7, height * 0.2, width * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        } else {
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, cfgColor1);
            grad.addColorStop(1, cfgColor2);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }

        // 1.2 Floating Particles
        if (showParticles) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            const particleCount = 20;
            const speed = time / 2000;
            for (let i = 0; i < particleCount; i++) {
                const px = ((Math.sin(i * 123.45) + 1) / 2 * width + Math.cos(speed + i) * 50) % width;
                const py = ((Math.cos(i * 543.21) + 1) / 2 * height - speed * 100 - i * 50) % height;
                const size = (Math.sin(i) + 1) * 2 + 1;
                ctx.beginPath();
                ctx.arc(px, py < 0 ? py + height : py, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 1.5 Draw Decorations
        if (quote.decorations && quote.decorations.length > 0) {
            for (let i = 0; i < quote.decorations.length; i++) {
                const decoration = quote.decorations[i];
                try {
                    let canvasToDraw = preparedDecorations[i] || null;
                    if (!canvasToDraw) {
                        canvasToDraw = await prepareDecoration(decoration.image);
                    }
                    if (canvasToDraw) {
                        const decoSize = width * decoration.size;
                        const decoX = (width * decoration.x) - (decoSize / 2);
                        const decoY = (height * decoration.y) - (decoSize / 2) + Math.sin(time / 1500 + i) * 20;

                        ctx.globalAlpha = 0.8;
                        ctx.drawImage(canvasToDraw, decoX, decoY, decoSize, decoSize);
                    }
                } catch (e) { }
            }
        }

        ctx.globalAlpha = 1.0;

        // 2. Draw Text Configuration
        ctx.fillStyle = cfgTextColor;
        const isStory = width === 1080 && height === 1920;
        const baseFontSize = isStory ? 72 : 55;
        const fontSize = baseFontSize * cfgFontSizeScale;

        ctx.font = `bold ${fontSize}px "Outfit", "Inter", sans-serif`;
        ctx.textAlign = cfgTextAlign;
        ctx.textBaseline = 'middle';

        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 30;

        const maxLineWidth = width * 0.85;
        const words = quote.text.split(' ');

        // Typewriter logic: Only show partial text based on time if enabled
        let visibleText = quote.text;
        if (config?.typewriterEffect) {
            const charCount = Math.floor(quote.text.length * Math.min(time / 3000, 1));
            visibleText = quote.text.substring(0, charCount);
        }

        const visibleWords = visibleText.split(' ');
        const lines: string[] = [];
        let currentLine = visibleWords[0];

        for (let i = 1; i < visibleWords.length; i++) {
            const testLine = currentLine + ' ' + visibleWords[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxLineWidth) {
                lines.push(currentLine);
                currentLine = visibleWords[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        const lineHeight = fontSize * 1.3;
        const totalHeight = lines.length * lineHeight;
        const startY = (height / 2) - (totalHeight / 2);
        const floatY = Math.sin(time / 2000) * 8;

        let textX = width / 2;
        if (cfgTextAlign === 'left') textX = width * 0.1;
        else if (cfgTextAlign === 'right') textX = width * 0.9;

        lines.forEach((line, i) => {
            // Gradient text for premium feel
            if (i === 0 && !config?.typewriterEffect) {
                const tGrad = ctx.createLinearGradient(textX - 100, 0, textX + 100, 0);
                tGrad.addColorStop(0, '#fff');
                tGrad.addColorStop(0.5, '#fcd34d'); // Gold tint
                tGrad.addColorStop(1, '#fff');
                ctx.fillStyle = tGrad;
            } else {
                ctx.fillStyle = cfgTextColor;
            }
            ctx.fillText(line, textX, startY + i * lineHeight + floatY);
        });

        // 4. Draw Author
        if (time > 1500 || !config?.typewriterEffect) {
            const authorAlpha = config?.typewriterEffect ? Math.min((time - 1500) / 1000, 1) : 1;
            ctx.globalAlpha = authorAlpha;
            ctx.font = `italic ${fontSize * 0.45}px "Inter", sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillText(`— ${quote.author}`, width / 2, startY + totalHeight + 60 + floatY);
            ctx.globalAlpha = 1.0;
        }

        // 5. Progress Bar at bottom (Viral style)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, height - 10, width, 10);
        ctx.fillStyle = cfgColor2;
        ctx.fillRect(0, height - 10, width * progress, 10);

        // 6. Watermark
        const selectedAccount = youtubeAccounts.find(acc => acc.id === selectedAccountId);
        const watermarkText = selectedAccount?.watermark || 'AgentX AI';
        ctx.font = `600 28px "Inter", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.shadowBlur = 0;
        ctx.fillText(watermarkText, width / 2, height - 80);
    };

    const downloadImage = async (quote: Quote, index: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = aspectRatio === 'story' ? 1920 : 1080;

        // Prepare all decorations
        const preparedDecos: (HTMLCanvasElement | null)[] = [];
        if (quote.decorations) {
            for (const deco of quote.decorations) {
                const prepared = await prepareDecoration(deco.image);
                preparedDecos.push(prepared);
            }
        }

        await drawCanvas(canvas, quote, 0, preparedDecos);

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

    const generateVideoBlob = async (quote: Quote, config?: RenderConfig): Promise<Blob | null> => {
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
                videoBitsPerSecond: 2500000 // 2.5 Mbps (Optimized for speed/quality balance)
            });

            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                resolve(blob);
            };

            mediaRecorder.start();

            const duration = videoDuration * 1000; // Use custom duration
            const startTime = Date.now();

            // Prepare all decorations
            const decorations: (HTMLCanvasElement | null)[] = [];
            if (quote.decorations) {
                for (const deco of quote.decorations) {
                    const prepared = await prepareDecoration(deco.image);
                    decorations.push(prepared);
                }
            }

            const animate = async () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < duration) {
                    await drawCanvas(canvas, quote, elapsed, decorations, config);

                    // Also draw to live preview if this is the active quote being visualized
                    if (livePreviewQuote === quote && livePreviewCanvasRef.current) {
                        const pCtx = livePreviewCanvasRef.current.getContext('2d');
                        if (pCtx) {
                            pCtx.drawImage(canvas, 0, 0, livePreviewCanvasRef.current.width, livePreviewCanvasRef.current.height);
                        }
                    }

                    requestAnimationFrame(animate);
                } else {
                    mediaRecorder.stop();
                    if (livePreviewQuote === quote) setLivePreviewQuote(null);
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

        // Store upload promises to track completion
        const uploadPromises: Promise<void>[] = [];

        try {
            const baseTime = new Date(scheduleTime).getTime();

            for (let i = 0; i < quotes.length; i++) {
                setScheduleProgress(`Generating video ${i + 1}/${quotes.length} (Uploads running in background)...`);

                // 1. Generate Video (Blocking - requires canvas access)
                const blob = await generateVideoBlob(quotes[i]);

                if (!blob) continue;

                // 2. Start Upload (Non-blocking / Pipelined)
                const uploadTask = (async () => {
                    try {
                        const publishTime = new Date(baseTime + (i * scheduleInterval * 60 * 1000));

                        const formData = new FormData();
                        formData.append('video', blob, `quote-${i}.webm`);

                        const quotePreview = quotes[i].text.substring(0, 45);
                        const viralTitle = `${quotePreview}... 🔥 #shorts #quotes #${quotes[i].category}`;
                        const viralDescription = `${quotes[i].text}\n\n- ${quotes[i].author}\n\n🔥 FOLLOW FOR MORE DAILY QUOTES! 🔥\n\n#shorts #quotes #motivation #inspiration #success #mindset #viral #trending #fyp #foryou #wisdom #dailyquotes #motivationalquotes #inspirationalquotes #${quotes[i].category} #shortsvideo #youtubeshorts #viralshorts #quotesoftheday #lifequotes`;

                        const viralTags = [
                            'shorts', 'quotes', 'motivation', 'inspiration', 'success',
                            'mindset', 'viral', 'trending', 'fyp', 'wisdom',
                            'daily quotes', 'motivational quotes', 'inspirational quotes',
                            quotes[i].category, 'youtube shorts', 'viral shorts',
                            'quotes of the day', 'life quotes', 'positive vibes', 'self improvement'
                        ];

                        formData.append('title', viralTitle);
                        formData.append('description', viralDescription);
                        formData.append('tags', JSON.stringify(viralTags));
                        formData.append('publishAt', publishTime.toISOString());

                        // Add metadata for analytics tracking
                        formData.append('topic', topic);
                        formData.append('templateId', `quote-${style}`);
                        formData.append('texts', JSON.stringify([quotes[i].text, quotes[i].author]));

                        if (selectedAccountId) {
                            formData.append('accountId', selectedAccountId);
                        }

                        const res = await fetch('/api/youtube/upload-video', {
                            method: 'POST',
                            body: formData
                        });

                        if (!res.ok) {
                            const errorData = await res.json().catch(() => ({}));
                            console.error(`Failed to upload video ${i + 1}:`, errorData);
                            setScheduleProgress(`Error uploading video ${i + 1}: ${errorData.error || 'Unknown error'}`);
                        }
                    } catch (err) {
                        console.error(`Upload error for video ${i + 1}`, err);
                    }
                })();

                uploadPromises.push(uploadTask);
            }

            setScheduleProgress('Finishing final uploads...');
            await Promise.all(uploadPromises);

            setScheduleProgress('All videos scheduled successfully!');
            setTimeout(() => setScheduleProgress(''), 3000);
        } catch (error) {
            console.error('Scheduling error:', error);
            setScheduleProgress('Error during scheduling');
        } finally {
            setIsScheduling(false);
        }
    };

    // --- BATCH AUTOMATION ---
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    const handleBatchAutoPilot = async () => {
        const settingsInfo = `Auto-Pilot Settings:\n- Style: ${autoPilotStyle}\n- Generations per channel: ${autoPilotGenerationsPerChannel}\n- Background: ${autoPilotBackgroundType}\n- Text align: ${autoPilotTextAlign}`;

        if (!confirm(`Start Auto-Pilot for Quotes?\n\n${settingsInfo}\n\nThis will:\n1. Read topics from topics.txt\n2. Generate ${autoPilotGenerationsPerChannel} quote(s) for EACH connected YouTube account\n3. Use your configured visual styles\n4. Upload automatically as #Shorts.`)) return;

        setIsBatchRunning(true);
        setBatchLogs(["Starting Quote Auto-Pilot...", settingsInfo]);

        try {
            // 1. Fetch Accounts
            addBatchLog("Fetching YouTube accounts...");
            const accountsRes = await fetch('/api/youtube/accounts');
            const accountsData = await accountsRes.json();
            const accounts = accountsData.accounts || [];

            if (accounts.length === 0) {
                throw new Error("No YouTube accounts connected!");
            }
            addBatchLog(`Found ${accounts.length} accounts: ${accounts.map((a: any) => a.channelName).join(', ')}`);

            // 2. Fetch Topics
            addBatchLog("Reading topics.txt...");
            const topicsRes = await fetch('/api/topics');
            const topicsData = await topicsRes.json();
            let topics = topicsData.topics || [];

            if (topics.length === 0) {
                throw new Error("No topics found or topics.txt is empty");
            }

            // Shuffle topics
            topics = topics.sort(() => 0.5 - Math.random());
            addBatchLog(`Loaded ${topics.length} topics. Assigned unique topics.`);

            // 3. Process loop
            let topicIndex = 0;
            const quotaExceededAccounts = new Set<string>();
            let successfulGlobal = 0;
            let failedGlobal = 0;

            // Flatten the work: Create a list of all "tasks" (account, video index)
            const tasks: { accountId: string, accountName: string, genNum: number }[] = [];
            accounts.forEach((acc: any) => {
                for (let n = 0; n < autoPilotGenerationsPerChannel; n++) {
                    tasks.push({ accountId: acc.id, accountName: acc.channelName, genNum: n });
                }
            });

            addBatchLog(`Total tasks: ${tasks.length} videos across ${accounts.length} accounts.`);

            for (let t = 0; t < tasks.length; t++) {
                const task = tasks[t];

                // If this account hit quota, try to find another account for this specific task
                if (quotaExceededAccounts.has(task.accountId)) {
                    const fallbackAccount = accounts.find((a: any) => !quotaExceededAccounts.has(a.id));
                    if (fallbackAccount) {
                        addBatchLog(`⚠️ Account ${task.accountName} hit quota. Rerouting task to ${fallbackAccount.channelName}...`);
                        task.accountId = fallbackAccount.id;
                        task.accountName = fallbackAccount.channelName;
                    } else {
                        addBatchLog(`❌ All accounts have reached their daily quota. Stopping Auto-Pilot.`);
                        break;
                    }
                }

                const topic = topics[topicIndex % topics.length];
                topicIndex++;

                addBatchLog(`\n📹 [${t + 1}/${tasks.length}] Channel: ${task.accountName} | Topic: "${topic}"`);

                // Generate Quote
                const qRes = await fetch("/api/quotes/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topic, count: 1, style: autoPilotStyle === 'random' ? 'inspirational' : autoPilotStyle })
                });
                const qData = await qRes.json();

                if (!qData.quotes || qData.quotes.length === 0) {
                    addBatchLog("   ❌ Generation failed");
                    failedGlobal++;
                    continue;
                }

                const quote: Quote = qData.quotes[0];

                // Visual Config
                const palettes = [
                    { c1: '#0f172a', c2: '#1e293b', c3: '#334155' }, { c1: '#450a0a', c2: '#7f1d1d', c3: '#991b1b' },
                    { c1: '#064e3b', c2: '#065f46', c3: '#047857' }, { c1: '#1e1b4b', c2: '#312e81', c3: '#3730a3' }
                ];
                const palette = palettes[Math.floor(Math.random() * palettes.length)];

                const config: RenderConfig = {
                    backgroundType: 'mesh',
                    backgroundImage: null,
                    color1: palette.c1, color2: palette.c2, color3: palette.c3,
                    textColor: '#ffffff',
                    textAlign: 'center',
                    fontSizeScale: 0.7,
                    showParticles: true,
                    typewriterEffect: true
                };

                addBatchLog("   🎨 Rendering Premium Video...");
                setLivePreviewQuote(quote);
                const blob = await generateVideoBlob(quote, config);

                if (!blob) {
                    addBatchLog("   ❌ Rendering failed");
                    failedGlobal++;
                    continue;
                }

                // Upload
                addBatchLog("   🚀 Uploading...");
                const formData = new FormData();
                formData.append('video', blob, `a-p-${task.accountId}-${t}.webm`);

                const quotePreview = quote.text.substring(0, 50);
                formData.append('title', `${quotePreview}... #shorts`);
                formData.append('description', `${quote.text}\n\n- ${quote.author}\n\n#quotes #motivation #viral`);
                formData.append('tags', JSON.stringify(['shorts', 'quotes', topic]));
                formData.append('topic', topic);
                formData.append('templateId', 'auto-pilot-v2');
                formData.append('texts', JSON.stringify([quote.text, quote.author]));
                formData.append('accountId', task.accountId);

                const uploadRes = await fetch('/api/youtube/upload-video', {
                    method: 'POST',
                    body: formData
                });

                if (uploadRes.ok) {
                    addBatchLog(`   ✅ SUCCESS! Posted to ${task.accountName}`);
                    successfulGlobal++;
                } else {
                    const err = await uploadRes.json();
                    if (uploadRes.status === 429 || err.error?.includes('Limit Reached')) {
                        addBatchLog(`   ⚠️ QUOTA REACHED for ${task.accountName}.`);
                        quotaExceededAccounts.add(task.accountId);
                        // Retry this task in next iteration with a different account
                        t--;
                        continue;
                    } else {
                        addBatchLog(`   ❌ FAILED: ${err.error}`);
                        failedGlobal++;
                    }
                }

                // Smooth delay to avoid rate limiting
                await new Promise(r => setTimeout(r, 3000));
            }

            addBatchLog(`\n✨ AUTO-PILOT FINISHED ✨\n📊 Results: ${successfulGlobal} posted, ${failedGlobal} failed.`);

        } catch (e: any) {
            console.error(e);
            addBatchLog(`CRITICAL ERROR: ${e.message}`);
        } finally {
            setIsBatchRunning(false);
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

            {/* Hero Section - Simplified/Removed since page header exists, or just a clean sub-banner */}
            <div className="bg-white rounded-3xl p-8 border border-[#e5e5e7] shadow-sm relative overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[#1d1d1f]">Create New Quote</h2>
                        <p className="text-[#86868b] mt-1">Generate viral quote videos optimized for Shorts & Reels.</p>
                    </div>
                    <div className="p-3 bg-[#F5F5F7] rounded-full">
                        <Sparkles className="text-black" size={24} />
                    </div>
                </div>
                {/* Subtle background detail */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-bl-full -mr-16 -mt-16 -z-0"></div>
            </div>

            {/* Main Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Quote Generation */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#e5e5e7] hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-2 mb-5">
                            <Sparkles className="text-black" size={20} />
                            <h2 className="text-lg font-bold text-[#1d1d1f]">Content</h2>
                        </div>

                        <div className="space-y-5">
                            <div className="relative">
                                <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">Topic</label>
                                <input
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Success, Mindset, Love..."
                                    className="w-full bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-3 text-[#1d1d1f] placeholder-[#86868b] focus:bg-white focus:border-[#000] focus:ring-0 outline-none transition-all"
                                />
                                <button
                                    onClick={handleSuggestTopic}
                                    disabled={isSuggesting}
                                    className="absolute right-2 top-[34px] p-2 hover:bg-gray-200 text-[#1d1d1f] rounded-lg transition-all"
                                    title="Suggest Trending Topic"
                                >
                                    {isSuggesting ? (
                                        <RefreshCw className="animate-spin" size={16} />
                                    ) : (
                                        <Sparkles size={16} />
                                    )}
                                </button>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">Vibe</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setStyle(s)}
                                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all border ${style === s
                                                ? 'bg-black text-white border-black shadow-lg'
                                                : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:bg-[#e5e5e7] hover:text-[#1d1d1f]'
                                                }`}
                                        >
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">
                                    Quantity <span className="text-black font-mono ml-2">{quoteCount}</span>
                                </label>
                                <div className="bg-[#F5F5F7] rounded-xl px-4 py-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={quoteCount}
                                        onChange={(e) => setQuoteCount(parseInt(e.target.value))}
                                        className="w-full accent-black h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, rgb(0, 0, 0) 0%, rgb(0, 0, 0) ${(quoteCount / 50) * 100}%, rgb(229, 231, 235) ${(quoteCount / 50) * 100}%, rgb(229, 231, 235) 100%)`
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">
                                    Video Duration <span className="text-black font-mono ml-2">{videoDuration}s</span>
                                </label>
                                <div className="bg-[#F5F5F7] rounded-xl px-4 py-4">
                                    <input
                                        type="range"
                                        min="5"
                                        max="15"
                                        step="1"
                                        value={videoDuration}
                                        onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                                        className="w-full accent-black h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, rgb(0, 0, 0) 0%, rgb(0, 0, 0) ${((videoDuration - 5) / 10) * 100}%, rgb(229, 231, 235) ${((videoDuration - 5) / 10) * 100}%, rgb(229, 231, 235) 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-xs text-[#86868b] mt-2 font-mono">
                                        <span>5s</span>
                                        <span>15s</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !topic}
                                className="w-full bg-black hover:bg-[#333] text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
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

                            {/* Auto-Pilot Settings Panel */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 space-y-4">
                                <button
                                    onClick={() => setShowAutoPilotSettings(!showAutoPilotSettings)}
                                    className="w-full flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <Rocket size={18} className="text-green-600" />
                                        <span className="text-sm font-bold text-green-900">Auto-Pilot Settings</span>
                                    </div>
                                    <ChevronDown
                                        size={18}
                                        className={`text-green-600 transition-transform ${showAutoPilotSettings ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {showAutoPilotSettings && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        {/* Style Selection */}
                                        <div>
                                            <label className="text-xs font-bold text-green-900 uppercase tracking-wider mb-2 block">
                                                Design Style
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['random', 'inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setAutoPilotStyle(s)}
                                                        className={`py-2 px-3 rounded-lg font-medium text-xs transition-all border ${autoPilotStyle === s
                                                            ? 'bg-green-600 text-white border-green-600 shadow-md'
                                                            : 'bg-white text-green-800 border-green-200 hover:bg-green-100'
                                                            }`}
                                                    >
                                                        {s === 'random' ? '🎲 Random' : s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Generations Per Channel */}
                                        <div>
                                            <label className="text-xs font-bold text-green-900 uppercase tracking-wider mb-2 block">
                                                Generations Per Channel <span className="text-green-600 font-mono ml-2">{autoPilotGenerationsPerChannel}</span>
                                            </label>
                                            <div className="bg-white rounded-lg px-4 py-3 border border-green-200">
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={autoPilotGenerationsPerChannel}
                                                    onChange={(e) => setAutoPilotGenerationsPerChannel(parseInt(e.target.value))}
                                                    className="w-full accent-green-600 h-2 bg-green-100 rounded-lg appearance-none cursor-pointer"
                                                    style={{
                                                        background: `linear-gradient(to right, rgb(22, 163, 74) 0%, rgb(22, 163, 74) ${(autoPilotGenerationsPerChannel / 10) * 100}%, rgb(220, 252, 231) ${(autoPilotGenerationsPerChannel / 10) * 100}%, rgb(220, 252, 231) 100%)`
                                                    }}
                                                />
                                                <div className="flex justify-between text-xs text-green-700 mt-2 font-mono">
                                                    <span>1</span>
                                                    <span>10</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Background Type */}
                                        <div>
                                            <label className="text-xs font-bold text-green-900 uppercase tracking-wider mb-2 block">
                                                Background Type
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['random', 'gradient', 'image'] as const).map(bg => (
                                                    <button
                                                        key={bg}
                                                        onClick={() => setAutoPilotBackgroundType(bg)}
                                                        className={`py-2 px-3 rounded-lg font-medium text-xs transition-all border ${autoPilotBackgroundType === bg
                                                            ? 'bg-green-600 text-white border-green-600 shadow-md'
                                                            : 'bg-white text-green-800 border-green-200 hover:bg-green-100'
                                                            }`}
                                                    >
                                                        {bg === 'random' ? '🎲' : bg === 'gradient' ? '🌈' : '🖼️'} {bg.charAt(0).toUpperCase() + bg.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Text Alignment */}
                                        <div>
                                            <label className="text-xs font-bold text-green-900 uppercase tracking-wider mb-2 block">
                                                Text Alignment
                                            </label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {(['random', 'left', 'center', 'right'] as const).map(align => (
                                                    <button
                                                        key={align}
                                                        onClick={() => setAutoPilotTextAlign(align)}
                                                        className={`py-2 px-3 rounded-lg font-medium text-xs transition-all border ${autoPilotTextAlign === align
                                                            ? 'bg-green-600 text-white border-green-600 shadow-md'
                                                            : 'bg-white text-green-800 border-green-200 hover:bg-green-100'
                                                            }`}
                                                    >
                                                        {align === 'random' ? '🎲' : align === 'left' ? '⬅️' : align === 'center' ? '↔️' : '➡️'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Batch Button */}
                            <button
                                onClick={handleBatchAutoPilot}
                                disabled={isBatchRunning || isGenerating}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {isBatchRunning ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Auto-Pilot Running...
                                    </>
                                ) : (
                                    <>
                                        <Rocket size={20} />
                                        Start Auto-Pilot
                                    </>
                                )}
                            </button>

                            {/* Batch Logs */}
                            {(batchLogs.length > 0) && (
                                <div className="mt-4 bg-[#111] border border-green-500/20 rounded-xl p-4 font-mono text-xs text-green-400 h-48 overflow-y-auto shadow-inner">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-green-500/20 text-gray-500">
                                        <Terminal size={12} />
                                        <span>SYSTEM LOGS</span>
                                    </div>
                                    <div className="space-y-1">
                                        {batchLogs.map((log, i) => (
                                            <div key={i} className="whitespace-pre-wrap">{log}</div>
                                        ))}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                {/* Middle Column: Preview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#e5e5e7] hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-2 mb-5">
                            <Monitor className="text-black" size={20} />
                            <h2 className="text-lg font-bold text-[#1d1d1f]">Live Preview</h2>
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
                                    <p className="text-white/90 text-xs font-medium italic drop-shadow-lg" style={{ fontSize: `${(aspectRatio === 'story' ? 0.9 : 1.0) * fontSizeScale * 0.6}rem` }}>
                                        - Preview Author
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Format Selection */}
                        <div className="mt-6">
                            <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">Format</label>
                            <div className="grid grid-cols-2 gap-2 bg-[#F5F5F7] rounded-xl p-1.5 border border-[#e5e5e7]">
                                <button
                                    onClick={() => setAspectRatio('square')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${aspectRatio === 'square'
                                        ? 'bg-white text-black shadow-md'
                                        : 'text-[#86868b] hover:text-[#1d1d1f]'
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
                    <div className="bg-white p-6 rounded-2xl border border-[#e5e5e7] hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-2 mb-5">
                            <Palette className="text-black" size={20} />
                            <h2 className="text-lg font-bold text-[#1d1d1f]">Background</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setBackgroundType('gradient')}
                                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border transition-all text-sm font-semibold ${backgroundType === 'gradient'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                                        }`}
                                >
                                    <Palette size={16} /> Gradient
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border transition-all text-sm font-semibold ${backgroundType === 'image'
                                        ? 'bg-black text-white border-black'
                                        : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:text-[#1d1d1f]'
                                        }`}
                                >
                                    <ImageIcon size={16} /> Image
                                </button>
                            </div>

                            {backgroundType === 'gradient' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-[#F5F5F7] p-3 rounded-xl border border-transparent flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={color1}
                                            onChange={(e) => setColor1(e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                                        />
                                        <div className="flex-1">
                                            <div className="text-xs text-[#86868b] mb-1">Color 1</div>
                                            <div className="text-sm text-[#1d1d1f] font-mono">{color1}</div>
                                        </div>
                                    </div>
                                    <div className="bg-[#F5F5F7] p-3 rounded-xl border border-transparent flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={color2}
                                            onChange={(e) => setColor2(e.target.value)}
                                            className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                                        />
                                        <div className="flex-1">
                                            <div className="text-xs text-[#86868b] mb-1">Color 2</div>
                                            <div className="text-sm text-[#1d1d1f] font-mono">{color2}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {backgroundType === 'image' && backgroundImage && (
                                <div className="bg-[#F5F5F7] p-3 rounded-xl border border-transparent text-center">
                                    <p className="text-sm text-green-600 flex items-center justify-center gap-2 font-medium">
                                        <ImageIcon size={14} /> Image uploaded
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Text Styling */}
                    <div className="bg-white p-6 rounded-2xl border border-[#e5e5e7] hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-2 mb-5">
                            <Type className="text-black" size={20} />
                            <h2 className="text-lg font-bold text-[#1d1d1f]">Text Style</h2>
                        </div>

                        <div className="space-y-4">
                            {/* Color */}
                            <div className="bg-[#F5F5F7] p-3 rounded-xl border border-transparent">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-[#86868b] uppercase">Color</span>
                                    <span className="text-xs font-mono text-[#1d1d1f]">{textColor}</span>
                                </div>
                                <input
                                    type="color"
                                    value={textColor}
                                    onChange={(e) => setTextColor(e.target.value)}
                                    className="w-full h-10 rounded-lg cursor-pointer border-2 border-white shadow-sm"
                                />
                            </div>

                            {/* Alignment */}
                            <div className="bg-[#F5F5F7] p-3 rounded-xl border border-transparent">
                                <div className="text-xs font-bold text-[#86868b] uppercase mb-3">Alignment</div>
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
                                                ? 'bg-white text-black shadow-md'
                                                : 'text-[#86868b] hover:text-[#1d1d1f]'
                                                }`}
                                        >
                                            <Icon size={18} />
                                            <span className="text-xs font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Size */}
                            <div className="bg-[#F5F5F7] p-3 rounded-xl border border-transparent">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-[#86868b] uppercase">Size</span>
                                    <span className="text-sm font-mono text-black bg-white px-3 py-1 rounded-lg border border-[#e5e5e7]">{Math.round(fontSizeScale * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setFontSizeScale(prev => Math.max(0.6, prev - 0.1))}
                                        className="p-2 bg-white hover:bg-[#e5e5e7] text-[#1d1d1f] rounded-lg transition-all border border-[#e5e5e7]"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-black transition-all duration-300"
                                            style={{ width: `${((fontSizeScale - 0.6) / (2.0 - 0.6)) * 100}%` }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setFontSizeScale(prev => Math.min(2.0, prev + 0.1))}
                                        className="p-2 bg-white hover:bg-[#e5e5e7] text-[#1d1d1f] rounded-lg transition-all border border-[#e5e5e7]"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Audio / Music Selection */}
                    <div className="bg-white p-6 rounded-2xl border border-[#e5e5e7] hover:shadow-lg transition-shadow">
                        <div className="flex items-center gap-2 mb-4">
                            <Music className="text-black" size={20} />
                            <h2 className="text-lg font-bold text-[#1d1d1f]">Music</h2>
                        </div>

                        {/* Music Source Toggle */}
                        <div className="grid grid-cols-2 gap-2 mb-4 bg-[#F5F5F7] rounded-xl p-1.5 border border-[#e5e5e7]">
                            <button
                                onClick={() => setUseLibraryMusic(true)}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${useLibraryMusic
                                    ? 'bg-white text-black shadow-md'
                                    : 'text-[#86868b] hover:text-[#1d1d1f]'
                                    }`}
                            >
                                <Music size={16} /> Library
                            </button>
                            <button
                                onClick={() => setUseLibraryMusic(false)}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${!useLibraryMusic
                                    ? 'bg-white text-black shadow-md'
                                    : 'text-[#86868b] hover:text-[#1d1d1f]'
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
                                        <label className="text-xs font-bold text-[#86868b] uppercase">Mood</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {musicLibrary.moods.map((mood) => (
                                                <button
                                                    key={mood.id}
                                                    onClick={() => setSelectedMood(mood.id)}
                                                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${selectedMood === mood.id
                                                        ? 'bg-black text-white'
                                                        : 'bg-[#F5F5F7] text-[#86868b] hover:text-[#1d1d1f]'
                                                        }`}
                                                >
                                                    <span>{mood.icon}</span>
                                                    <span>{mood.name}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Track Selection */}
                                        <div className="mt-4">
                                            <label className="text-xs font-bold text-[#86868b] uppercase mb-2 block">Select Track</label>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                {musicLibrary.tracks
                                                    .filter(track => track.mood === selectedMood)
                                                    .map((track) => (
                                                        <button
                                                            key={track.id}
                                                            onClick={() => handleTrackSelect(track)}
                                                            className={`w-full text-left p-3 rounded-lg transition-all border ${selectedTrack?.id === track.id
                                                                ? 'bg-[#F5F5F7] border-black'
                                                                : 'bg-white border-[#e5e5e7] hover:border-[#86868b]'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className={`text-sm font-semibold ${selectedTrack?.id === track.id ? 'text-[#1d1d1f]' : 'text-[#86868b]'
                                                                        }`}>
                                                                        {track.name}
                                                                    </div>
                                                                    <div className="text-xs text-[#86868b] mt-1">{track.description}</div>
                                                                </div>
                                                                {selectedTrack?.id === track.id && (
                                                                    <div className="ml-2 w-2 h-2 bg-black rounded-full" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Audio Preview */}
                                        {selectedTrack && (
                                            <div className="mt-4 bg-[#F5F5F7] p-3 rounded-xl border border-transparent">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex-1">
                                                        <div className="text-xs text-[#86868b]">Now Playing</div>
                                                        <div className="text-sm font-semibold text-[#1d1d1f]">{selectedTrack.name}</div>
                                                    </div>
                                                    <button
                                                        onClick={togglePreview}
                                                        className="p-2 bg-black hover:bg-[#333] text-white rounded-full transition-all"
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
                                className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border transition-all group ${audioFile
                                    ? 'border-black bg-black text-white'
                                    : 'border-[#e5e5e7] bg-[#F5F5F7] text-[#86868b] hover:border-[#86868b]'
                                    }`}
                            >
                                <span className="flex items-center gap-3 text-sm font-semibold">
                                    <Music size={18} className={audioFile ? "text-white" : "text-[#86868b]"} />
                                    {audioFile ? audioFile.name : 'Upload Background Music'}
                                </span>
                                {!audioFile && <Upload size={16} className="opacity-50 group-hover:opacity-100" />}
                            </button>
                        )}
                    </div>
                </div>
            </div >

            {/* Scheduling Section */}
            {
                quotes.length > 0 && (
                    <div className="bg-white p-8 rounded-2xl border border-[#e5e5e7] shadow-lg animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-[#e5e5e7] rounded-full">
                                <Calendar className="text-black" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[#1d1d1f]">Schedule Posting</h2>
                                <p className="text-[#86868b] text-sm mt-1">Automate your YouTube Shorts uploads</p>
                            </div>
                        </div>

                        {/* YouTube Account Selector */}
                        <div>
                            <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">
                                YouTube Account
                            </label>
                            {youtubeAccounts.length > 0 ? (
                                <select
                                    value={selectedAccountId || ''}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                    className="w-full bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-3 text-[#1d1d1f] focus:bg-white focus:border-black focus:ring-0 outline-none transition-all"
                                >
                                    {youtubeAccounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.channelName} {account.isActive ? '(Active)' : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-3 flex items-center gap-3">
                                    <Youtube className="text-red-500" size={20} />
                                    <span className="text-[#86868b] text-sm">No YouTube accounts connected</span>
                                    <a
                                        href="/settings"
                                        className="ml-auto text-[#1d1d1f] hover:underline text-sm font-semibold"
                                    >
                                        Connect
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div>
                                <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">Start Time</label>
                                <input
                                    type="datetime-local"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                    className="w-full bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-3 text-[#1d1d1f] focus:bg-white focus:border-black focus:ring-0 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">Interval (Minutes)</label>
                                <div className="flex items-center gap-3 bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-3">
                                    <Clock size={18} className="text-[#86868b]" />
                                    <input
                                        type="number"
                                        min="1"
                                        value={scheduleInterval}
                                        onChange={(e) => setScheduleInterval(parseInt(e.target.value))}
                                        className="w-full bg-transparent text-[#1d1d1f] outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-end">
                                <button
                                    onClick={handleSchedule}
                                    disabled={isScheduling || !scheduleTime}
                                    className="w-full bg-black hover:bg-[#333] text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isScheduling ? scheduleProgress : `Schedule ${quotes.length} Video${quotes.length > 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            {
                quotes.length > 0 && (
                    <>
                        <div className="flex items-center justify-between pt-8">
                            <div>
                                <h2 className="text-2xl font-bold text-[#1d1d1f]">Generated Quotes</h2>
                                <p className="text-[#86868b] text-sm mt-1">{quotes.length} quote{quotes.length > 1 ? 's' : ''} ready to download</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {quotes.map((quote, index) => (
                                <div
                                    key={index}
                                    className={`relative group overflow-hidden rounded-2xl border border-[#e5e5e7] transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] ${aspectRatio === 'story' ? 'aspect-[9/16]' : 'aspect-square'
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

                                    {/* Decoration Overlays for Grid Item - PLACED BEHIND CONTENT */}
                                    {quote.decorations && quote.decorations.map((deco, decoIdx) => (
                                        <div
                                            key={decoIdx}
                                            className="absolute pointer-events-none transition-transform duration-700 group-hover:scale-105 z-1"
                                            style={{
                                                left: `${deco.x * 100}%`,
                                                top: `${deco.y * 100}%`,
                                                width: `${deco.size * 100}%`,
                                                aspectRatio: '1',
                                                transform: 'translate(-50%, -50%)',
                                                backgroundImage: `url(${deco.image})`,
                                                backgroundSize: 'contain',
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'center',
                                                opacity: 1
                                            }}
                                        />
                                    ))}

                                    {/* Content */}
                                    <div className="absolute inset-0 z-10 p-8 flex flex-col justify-center items-center text-center">
                                        <Sparkles className="text-white/30 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500" size={24} />
                                        <p
                                            className="text-white font-bold leading-relaxed mb-6 drop-shadow-2xl"
                                            style={{
                                                color: textColor,
                                                textAlign: textAlign,
                                                fontSize: `${(aspectRatio === 'story' ? 0.85 : 0.8) * fontSizeScale}rem`
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
                                    <div className="absolute inset-0 z-20 bg-black/80 flex flex-col justify-center items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                                        <button
                                            onClick={() => downloadImage(quote, index)}
                                            className="w-60 bg-white text-black hover:bg-gray-200 py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 transform hover:scale-105 shadow-xl"
                                        >
                                            <Download size={18} />
                                            Download Image
                                        </button>
                                        <button
                                            onClick={() => downloadVideo(quote, index)}
                                            className="w-60 bg-[#1d1d1f] text-white hover:bg-black py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 transform hover:scale-105 shadow-xl border border-[#333]"
                                        >
                                            <Video size={18} />
                                            Download 30s Video
                                        </button>
                                        {(useLibraryMusic && selectedTrack) || audioFile ? (
                                            <div className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full border border-white/20 text-xs font-semibold">
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
                )
            }
            {/* --- AUTO-PILOT OVERLAY --- */}
            {isBatchRunning && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
                    <div className="bg-[#1c1c1e] border border-white/10 w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">

                        {/* Left: Live Render Feed */}
                        <div className="w-full md:w-2/5 bg-black flex flex-col items-center justify-center p-6 border-r border-white/10">
                            <div className="mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                                <span className="text-white font-bold uppercase tracking-widest text-xs">Live Generation Feed</span>
                            </div>

                            <div className="relative aspect-[9/16] h-full max-h-[60vh] rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-neutral-900 flex items-center justify-center">
                                {livePreviewQuote ? (
                                    <canvas
                                        ref={livePreviewCanvasRef}
                                        width={1080}
                                        height={1920}
                                        className="h-full w-auto object-contain"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-white/20">
                                        <div className="w-12 h-12 border-2 border-dashed border-white/20 rounded-full animate-spin" />
                                        <p className="text-sm">Preparing Next Viral Clip...</p>
                                    </div>
                                )}
                            </div>

                            {livePreviewQuote && (
                                <div className="mt-6 w-full max-w-xs text-center">
                                    <p className="text-white/40 text-[10px] uppercase font-bold mb-1">Author Pick</p>
                                    <p className="text-white font-medium text-sm line-clamp-2 italic">"{livePreviewQuote.text}"</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Modern Console Logs */}
                        <div className="flex-1 flex flex-col bg-[#1c1c1e]">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                                        <Terminal className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg">Auto-Pilot Engine v2.0</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => { if (confirm("Stop Auto-Pilot?")) { setIsBatchRunning(false); alert("Auto-Pilot will stop after current video."); } }}
                                        className="text-xs text-white/40 hover:text-red-400 transition-colors"
                                    >
                                        FORCE STOP
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar">
                                {batchLogs.map((log, i) => {
                                    const isSuccess = log.includes("✅");
                                    const isError = log.includes("❌") || log.includes("⚠️");
                                    const isSummary = log.includes("✨");

                                    return (
                                        <div key={i} className={`py-1 border-b border-white/5 ${isSuccess ? 'text-emerald-400' : isError ? 'text-amber-400' : isSummary ? 'text-indigo-400 font-bold text-sm pt-4' : 'text-white/60'}`}>
                                            {log}
                                        </div>
                                    )
                                })}
                                <div ref={logsEndRef} />
                            </div>

                            <div className="p-6 bg-black/20 border-t border-white/5">
                                <p className="text-[10px] text-white/30 text-center">
                                    SYSTEM: AgentX Cloud AI distributing tasks across {youtubeAccounts.length} accounts.
                                    Do not close this tab.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
