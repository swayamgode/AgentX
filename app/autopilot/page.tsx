'use client';

import { useState, useRef, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Rocket, Terminal, Loader2, Settings as SettingsIcon, Zap, TrendingUp, Video } from "lucide-react";

interface Decoration {
    image: string;
    x: number; // 0-1 range
    y: number; // 0-1 range
    size: number; // 0.15-0.5 range (relative to canvas width)
}

interface Quote {
    text: string;
    author: string;
    category?: string;
    decorations?: Decoration[];
}

interface RenderConfig {
    backgroundType: 'gradient' | 'image';
    backgroundImage: string | null;
    color1: string;
    color2: string;
    textColor: string;
    textAlign: 'left' | 'center' | 'right';
    fontSizeScale: number;
}

// Helper to load image for canvas
const prepareDecoration = async (url: string): Promise<HTMLCanvasElement | null> => {
    if (!url) return null;
    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;

        if (!img.complete) {
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
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

const drawCanvas = async (canvas: HTMLCanvasElement, quote: Quote, time: number = 0, preparedDecorations: (HTMLCanvasElement | null)[] = [], config: RenderConfig, watermarkText: string = 'AgentX', effects?: { bgGradient: any, particleSystem: any }) => {
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Animation factors (0 to 1 over 10 seconds)
    const progress = Math.min(time / 10000, 1);
    const zoom = 1 + (progress * 0.1); // Zoom from 1.0 to 1.1

    // 1. Draw Background
    if (config.backgroundType === 'image' && config.backgroundImage) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = config.backgroundImage;

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

        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, width, height);
    } else {
        // Advanced Gradient Background
        if (effects?.bgGradient) {
            ctx.fillStyle = '#0f0f0f';
            ctx.fillRect(0, 0, width, height);
            effects.bgGradient.update();
            effects.bgGradient.draw(ctx);
        } else {
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, config.color1);
            grad.addColorStop(1, config.color2);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }
    }

    // Draw Particles
    if (effects?.particleSystem) {
        effects.particleSystem.update();
        effects.particleSystem.draw(ctx);
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
                    const decoY = (height * decoration.y) - (decoSize / 2);

                    ctx.globalAlpha = 1.0;
                    ctx.drawImage(canvasToDraw, decoX, decoY, decoSize, decoSize);
                }
            } catch (e) {
                console.error(`Failed to draw decoration ${i}`, e);
            }
        }
    }

    ctx.globalAlpha = 1.0;

    // 2. Draw Text
    ctx.fillStyle = config.textColor;
    const isStory = width === 1080 && height === 1920;
    const baseFontSize = isStory ? 64 : 50;
    const fontSize = baseFontSize * config.fontSizeScale;

    ctx.font = `bold ${fontSize}px "Inter", Arial, sans-serif`;
    ctx.textAlign = config.textAlign;
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

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

    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    const startY = (height / 2) - (totalHeight / 2);

    const floatY = Math.sin(time / 2000) * 10;

    let textX = width / 2;
    if (config.textAlign === 'left') textX = width * 0.1;
    else if (config.textAlign === 'right') textX = width * 0.9;

    lines.forEach((line, i) => {
        ctx.fillText(line, textX, startY + i * lineHeight + floatY);
    });

    // 4. Draw Author
    ctx.font = `italic ${fontSize * 0.4}px "Inter", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(`- ${quote.author}`, width / 2, startY + totalHeight + 40 + floatY);

    // 5. Draw Watermark
    ctx.font = `500 24px "Inter", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.shadowBlur = 0;
    ctx.fillText(watermarkText, width / 2, height - 80);
};

const generateVideoBlob = async (quote: Quote, config: RenderConfig, watermarkText: string): Promise<Blob | null> => {
    // Import visual effects
    const { MeshGradient, ParticleSystem } = await import('@/lib/visual-effects');
    const bgGradient = new MeshGradient(1080, 1920);
    const particleSystem = new ParticleSystem(1080, 1920, 30);

    return new Promise(async (resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;

        const canvasStream = canvas.captureStream(30);

        let mimeType = 'video/webm;codecs=h264';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp9';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
        }

        const mediaRecorder = new MediaRecorder(canvasStream, {
            mimeType: mimeType,
            videoBitsPerSecond: 6000000 // High quality
        });

        const chunks: BlobPart[] = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
        };

        mediaRecorder.start();

        const duration = 10000; // 10 seconds
        const startTime = Date.now();

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
                await drawCanvas(canvas, quote, elapsed, decorations, config, watermarkText, { bgGradient, particleSystem });
                requestAnimationFrame(animate);
            } else {
                mediaRecorder.stop();
            }
        };
        animate();
    });
};

export default function AutoPilotPage() {
    // Auto-Pilot Configuration State
    const [autoPilotStyle, setAutoPilotStyle] = useState<'random' | 'inspirational' | 'funny' | 'wisdom' | 'success'>('random');
    const [autoPilotGenerationsPerChannel, setAutoPilotGenerationsPerChannel] = useState(1);
    const [autoPilotBackgroundType, setAutoPilotBackgroundType] = useState<'random' | 'gradient' | 'image'>('gradient');
    const [autoPilotTextAlign, setAutoPilotTextAlign] = useState<'random' | 'left' | 'center' | 'right'>('center');

    // Batch Automation State
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [batchLogs, setBatchLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [availableGraphics, setAvailableGraphics] = useState<string[]>([]);

    useEffect(() => {
        // Auto-start if requested via query param
        const searchParams = new URLSearchParams(window.location.search);
        if ((searchParams.get('auto') === 'true' || searchParams.get('automate') === 'true') && !isBatchRunning) {
            handleStartAutoPilot();
        }
    }, []);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [batchLogs]);

    useEffect(() => {
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
        loadGraphics();
    }, []);

    const addBatchLog = (msg: string) => {
        setBatchLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const handleStartAutoPilot = async () => {
        const settingsInfo = `Auto-Pilot Settings:\n- Style: ${autoPilotStyle}\n- Generations per channel: ${autoPilotGenerationsPerChannel}\n- Background: ${autoPilotBackgroundType}\n- Text align: ${autoPilotTextAlign}`;

        const searchParams = new URLSearchParams(window.location.search);
        const isAuto = searchParams.get('auto') === 'true' || searchParams.get('automate') === 'true';

        if (!isAuto && !confirm(`Start Auto-Pilot for Quotes?\n\n${settingsInfo}\n\nThis will:\n1. Read topics from topics.txt\n2. Generate ${autoPilotGenerationsPerChannel} quote(s) for EACH connected YouTube account\n3. Use your configured visual styles\n4. Upload automatically as #Shorts.`)) return;

        setIsBatchRunning(true);
        setBatchLogs(["🚀 Starting Quote Auto-Pilot...", settingsInfo]);

        try {
            // 1. Fetch Accounts
            addBatchLog("📋 Fetching YouTube accounts...");
            const accountsRes = await fetch('/api/youtube/accounts');
            const accountsData = await accountsRes.json();
            const accounts = accountsData.accounts || [];

            if (accounts.length === 0) {
                throw new Error("No YouTube accounts connected!");
            }
            addBatchLog(`✅ Found ${accounts.length} accounts: ${accounts.map((a: any) => a.channelName).join(', ')}`);

            // 2. Fetch Topics
            addBatchLog("📖 Reading topics.txt...");
            const topicsRes = await fetch('/api/topics');
            const topicsData = await topicsRes.json();
            let topics = topicsData.topics || [];

            if (topics.length === 0) {
                throw new Error("No topics found or topics.txt is empty");
            }

            // Shuffle topics
            topics = topics.sort(() => 0.5 - Math.random());
            addBatchLog(`✅ Loaded ${topics.length} topics`);

            // 3. Calculate total videos
            const totalVideos = accounts.length * autoPilotGenerationsPerChannel;
            addBatchLog(`📊 Will generate ${totalVideos} total videos (${accounts.length} accounts × ${autoPilotGenerationsPerChannel} videos)`);

            // 4. Process loop with quota limit handling
            let topicIndex = 0;
            let successCount = 0;
            let failCount = 0;
            let quotaExceededAccounts = new Set<string>();
            let accountVideoCount = new Map<string, number>(); // Track videos per account

            // Track videos to generate
            let videosToGenerate: Array<{ account: any; topic: string; videoNum: number }> = [];

            // Build queue of all videos to generate
            for (let i = 0; i < accounts.length; i++) {
                const account = accounts[i];
                accountVideoCount.set(account.id, 0); // Initialize counter
                for (let genNum = 0; genNum < autoPilotGenerationsPerChannel; genNum++) {
                    const topic = topics[topicIndex % topics.length];
                    topicIndex++;
                    videosToGenerate.push({ account, topic, videoNum: genNum + 1 });
                }
            }

            addBatchLog(`📦 Queue: ${videosToGenerate.length} videos to generate across ${accounts.length} accounts`);

            // Process each video
            for (let i = 0; i < videosToGenerate.length; i++) {
                const { account, topic, videoNum } = videosToGenerate[i];

                // Skip if account quota exceeded
                if (quotaExceededAccounts.has(account.id)) {
                    addBatchLog(`\n⏭️  Skipping ${account.channelName} (quota exceeded)`);
                    continue;
                }

                addBatchLog(`\n➡️  Video ${i + 1}/${videosToGenerate.length} - ${account.channelName}`);
                addBatchLog(`   📝 Topic: "${topic}"`);

                try {
                    // Determine style
                    const styles = ['inspirational', 'wisdom', 'success', 'funny'];
                    let selectedStyle: string;
                    if (autoPilotStyle === 'random') {
                        selectedStyle = styles[Math.floor(Math.random() * styles.length)];
                    } else {
                        selectedStyle = autoPilotStyle;
                    }

                    // Generate Quote
                    addBatchLog(`   ⚡ Generating quote (${selectedStyle})...`);
                    const qRes = await fetch("/api/quotes/generate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ topic, count: 1, style: selectedStyle })
                    });
                    const qData = await qRes.json();

                    if (!qData.quotes || qData.quotes.length === 0) {
                        addBatchLog("   ❌ Failed to generate quote");
                        failCount++;
                        continue;
                    }

                    let quote: Quote = qData.quotes[0];
                    addBatchLog(`   ✅ Quote: "${quote.text.substring(0, 50)}..."`);

                    // Enhance with decorations if available
                    if (availableGraphics.length > 0) {
                        const decorations: Decoration[] = [];
                        const numDecorations = Math.floor(Math.random() * 4); // 0-3 decorations
                        for (let d = 0; d < numDecorations; d++) {
                            const randomGraphic = availableGraphics[Math.floor(Math.random() * availableGraphics.length)];
                            decorations.push({
                                image: randomGraphic,
                                x: Math.random(),
                                y: Math.random(),
                                size: 0.15 + Math.random() * 0.25
                            });
                        }
                        quote.decorations = decorations;
                    }

                    // Determine background type
                    let bgType: 'gradient' | 'image' = 'gradient';
                    // Current autopilot doesn't support image upload yet, so default to gradient
                    // But if it did, we'd use state. For now, gradient.

                    // Determine text alignment
                    let alignment: 'left' | 'center' | 'right';
                    if (autoPilotTextAlign === 'random') {
                        const alignments: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
                        alignment = alignments[Math.floor(Math.random() * alignments.length)];
                    } else {
                        alignment = autoPilotTextAlign as 'left' | 'center' | 'right';
                    }

                    // Create Config
                    const renderConfig: RenderConfig = {
                        backgroundType: bgType,
                        backgroundImage: null,
                        color1: '#000000', // Black
                        color2: '#000000', // Black
                        textColor: '#ffffff',
                        textAlign: alignment,
                        fontSizeScale: 0.5 + (Math.random() * 0.3) // 0.5 to 0.8
                    };

                    addBatchLog(`   🎨 Rendering video (${bgType} bg, ${alignment} align)...`);

                    // Generate video using shared logic
                    const blob = await generateVideoBlob(
                        quote,
                        renderConfig,
                        account.watermark || 'AgentX'
                    );

                    if (!blob) {
                        addBatchLog("   ❌ Failed to generate video blob");
                        failCount++;
                        continue;
                    }

                    // Upload to YouTube
                    const formData = new FormData();
                    formData.append('video', blob, `quote-autopilot-${Date.now()}.webm`);
                    formData.append('title', `${quote.text.substring(0, 80)} #Shorts`);
                    formData.append('description', `${quote.text}\n\n${quote.author ? `- ${quote.author}` : ''}\n\n#Shorts #Quotes #${selectedStyle}`);
                    formData.append('tags', JSON.stringify(['shorts', 'quotes', selectedStyle, topic]));
                    formData.append('accountId', account.id);
                    formData.append('topic', topic);
                    formData.append('templateId', 'quote-autopilot');
                    formData.append('texts', JSON.stringify([quote.text]));

                    // Upload to YouTube
                    addBatchLog(`   📤 Uploading to YouTube...`);
                    const uploadRes = await fetch('/api/youtube/upload-video', {
                        method: 'POST',
                        body: formData
                    });

                    const uploadData = await uploadRes.json();

                    if (uploadRes.status === 429 || uploadData.error?.includes('Daily Upload Limit')) {
                        // Quota exceeded for this account
                        addBatchLog(`   ⚠️  QUOTA EXCEEDED for ${account.channelName}`);
                        quotaExceededAccounts.add(account.id);

                        // Try to find another account that hasn't exceeded quota
                        const availableAccount = accounts.find((a: any) => !quotaExceededAccounts.has(a.id));
                        if (availableAccount) {
                            addBatchLog(`   🔄 Switching to ${availableAccount.channelName}...`);
                            // Re-queue this video for the available account
                            videosToGenerate[i] = { ...videosToGenerate[i], account: availableAccount };
                            i--; // Retry this iteration with new account
                            continue;
                        } else {
                            addBatchLog(`   ❌ All accounts have exceeded quota!`);
                            failCount++;
                            continue;
                        }
                    }

                    if (!uploadData.success) {
                        addBatchLog(`   ❌ Upload failed: ${uploadData.error}`);
                        failCount++;
                        continue;
                    }

                    addBatchLog(`   ✅ SUCCESS! Uploaded to ${account.channelName}`);
                    addBatchLog(`   🔗 ${uploadData.videoUrl}`);
                    successCount++;

                    // Track video count for this account
                    const currentCount = accountVideoCount.get(account.id) || 0;
                    accountVideoCount.set(account.id, currentCount + 1);

                } catch (error: any) {
                    addBatchLog(`   ❌ ERROR: ${error.message}`);
                    failCount++;
                }
            }

            addBatchLog(`\n✨ AUTO-PILOT COMPLETE! ✨`);
            addBatchLog(`📊 Results: ${successCount} successful, ${failCount} failed`);
            addBatchLog(`\n📈 Videos Posted Per Account:`);

            // Show detailed breakdown per account
            for (const account of accounts) {
                const count = accountVideoCount.get(account.id) || 0;
                const quotaHit = quotaExceededAccounts.has(account.id);
                const status = quotaHit ? '⚠️ QUOTA LIMIT REACHED' : '✅';
                addBatchLog(`   ${status} ${account.channelName}: ${count} video(s)`);
            }

            if (quotaExceededAccounts.size > 0) {
                addBatchLog(`\n⚠️  ${quotaExceededAccounts.size} account(s) reached daily upload quota`);
                addBatchLog(`💡 Tip: Videos were redistributed to other accounts automatically`);
            }

            addBatchLog(`\n🎉 Total videos successfully posted: ${successCount}`);

        } catch (e: any) {
            console.error(e);
            addBatchLog(`❌ CRITICAL ERROR: ${e.message}`);
        } finally {
            setIsBatchRunning(false);
            const searchParams = new URLSearchParams(window.location.search);
            if (searchParams.get('auto') === 'true' || searchParams.get('automate') === 'true') {
                addBatchLog("🏁 Auto-Pilot finished. Closing window in 5 seconds...");
                setTimeout(() => window.close(), 5000);
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F5F5F7]">
            <LeftSidebar />

            <main className="flex-1 ml-0 md:ml-0 pb-20 md:pb-8">
                {/* Top Header */}
                <div className="sticky top-0 bg-white/80 backdrop-blur-xl z-20 border-b border-[#e5e5e7]">
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-[#000] to-[#333] rounded-xl">
                                <Rocket className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-[#1d1d1f]">
                                    Auto-Pilot
                                </h1>
                                <p className="text-xs md:text-sm text-[#86868b] mt-0.5">
                                    Automated content generation and posting
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 md:py-8 space-y-6">
                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FeatureCard
                            icon={<Zap className="w-5 h-5" />}
                            title="Smart Generation"
                            description="Automatically generates unique content for each channel"
                            color="from-[#000] to-[#333]"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-5 h-5" />}
                            title="Configurable Styles"
                            description="Choose design preferences or let AI randomize"
                            color="from-[#1a1a1a] to-[#000]"
                        />
                        <FeatureCard
                            icon={<Video className="w-5 h-5" />}
                            title="Bulk Upload"
                            description="Upload multiple videos across all accounts at once"
                            color="from-[#333] to-[#1a1a1a]"
                        />
                    </div>

                    {/* Settings and Control Panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Settings */}
                        <div className="space-y-6">
                            <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-6">
                                    <SettingsIcon className="text-[#1d1d1f]" size={20} />
                                    <h2 className="text-lg font-bold text-[#1d1d1f]">Auto-Pilot Settings</h2>
                                </div>

                                <div className="space-y-5">
                                    {/* Style Selection */}
                                    <div>
                                        <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">
                                            Design Style
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['random', 'inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setAutoPilotStyle(s)}
                                                    className={`py-2.5 px-3 rounded-lg font-medium text-sm transition-all border ${autoPilotStyle === s
                                                        ? 'bg-black text-white border-black shadow-md'
                                                        : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:bg-[#e5e5e7] hover:text-[#1d1d1f]'
                                                        }`}
                                                >
                                                    {s === 'random' ? '🎲 Random' : s.charAt(0).toUpperCase() + s.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Generations Per Channel */}
                                    <div>
                                        <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">
                                            Generations Per Channel <span className="text-[#1d1d1f] font-mono ml-2">{autoPilotGenerationsPerChannel}</span>
                                        </label>
                                        <div className="bg-[#F5F5F7] rounded-xl px-4 py-4">
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={autoPilotGenerationsPerChannel}
                                                onChange={(e) => setAutoPilotGenerationsPerChannel(parseInt(e.target.value))}
                                                className="w-full accent-black h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, rgb(0, 0, 0) 0%, rgb(0, 0, 0) ${(autoPilotGenerationsPerChannel / 10) * 100}%, rgb(229, 231, 235) ${(autoPilotGenerationsPerChannel / 10) * 100}%, rgb(229, 231, 235) 100%)`
                                                }}
                                            />
                                            <div className="flex justify-between text-xs text-[#86868b] mt-2 font-mono">
                                                <span>1</span>
                                                <span>10</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Background Type */}
                                    <div>
                                        <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">
                                            Background Type
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['random', 'gradient', 'image'] as const).map(bg => (
                                                <button
                                                    key={bg}
                                                    onClick={() => setAutoPilotBackgroundType(bg)}
                                                    className={`py-2.5 px-3 rounded-lg font-medium text-sm transition-all border ${autoPilotBackgroundType === bg
                                                        ? 'bg-black text-white border-black shadow-md'
                                                        : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:bg-[#e5e5e7] hover:text-[#1d1d1f]'
                                                        }`}
                                                >
                                                    {bg === 'random' ? '🎲' : bg === 'gradient' ? '🌈' : '🖼️'}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-[#86868b] mt-2">
                                            {autoPilotBackgroundType === 'gradient' && '✓ Using plain black background'}
                                            {autoPilotBackgroundType === 'random' && 'Will randomize between available options'}
                                            {autoPilotBackgroundType === 'image' && 'Will use uploaded background images'}
                                        </p>
                                    </div>

                                    {/* Text Alignment */}
                                    <div>
                                        <label className="text-xs font-bold text-[#86868b] uppercase tracking-wider mb-2 block">
                                            Text Alignment
                                        </label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(['random', 'left', 'center', 'right'] as const).map(align => (
                                                <button
                                                    key={align}
                                                    onClick={() => setAutoPilotTextAlign(align)}
                                                    className={`py-2.5 px-3 rounded-lg font-medium text-sm transition-all border ${autoPilotTextAlign === align
                                                        ? 'bg-black text-white border-black shadow-md'
                                                        : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:bg-[#e5e5e7] hover:text-[#1d1d1f]'
                                                        }`}
                                                >
                                                    {align === 'random' ? '🎲' : align === 'left' ? '⬅️' : align === 'center' ? '↔️' : '➡️'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Start Button */}
                                    <button
                                        onClick={handleStartAutoPilot}
                                        disabled={isBatchRunning}
                                        className="w-full bg-black hover:bg-[#333] text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
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
                                </div>
                            </div>
                        </div>

                        {/* Right: Logs */}
                        <div className="space-y-6">
                            <div className="bg-white border border-[#e5e5e7] rounded-2xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Terminal className="text-[#1d1d1f]" size={20} />
                                    <h2 className="text-lg font-bold text-[#1d1d1f]">System Logs</h2>
                                </div>

                                {batchLogs.length > 0 ? (
                                    <div className="bg-[#111] border border-[#333] rounded-xl p-4 font-mono text-xs text-[#86868b] h-[500px] overflow-y-auto shadow-inner">
                                        <div className="space-y-1">
                                            {batchLogs.map((log, i) => (
                                                <div key={i} className="whitespace-pre-wrap text-white">{log}</div>
                                            ))}
                                            <div ref={logsEndRef} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-[#F5F5F7] border border-[#e5e5e7] rounded-xl p-8 text-center">
                                        <Terminal className="w-12 h-12 text-[#86868b] mx-auto mb-3 opacity-50" />
                                        <p className="text-sm text-[#86868b]">No logs yet. Start Auto-Pilot to see activity.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="bg-[#F5F5F7] border border-[#e5e5e7] rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-[#1d1d1f] mb-3">
                            📚 How Auto-Pilot Works
                        </h3>
                        <ol className="space-y-2 text-sm text-[#86868b]">
                            <li className="flex gap-2">
                                <span className="font-bold text-[#1d1d1f]">1.</span>
                                <span>Configure your preferences above (style, generations per channel, etc.)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-[#1d1d1f]">2.</span>
                                <span>Ensure you have connected YouTube accounts in Settings</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-[#1d1d1f]">3.</span>
                                <span>Edit <code className="bg-white px-2 py-0.5 rounded border border-[#e5e5e7]">topics.txt</code> to customize content themes</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-[#1d1d1f]">4.</span>
                                <span>Click "Start Auto-Pilot" to begin automated generation and upload</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-[#1d1d1f]">5.</span>
                                <span>Monitor progress in the System Logs panel</span>
                            </li>
                        </ol>
                    </div>
                </div>
            </main>

            <MobileNav />
        </div>
    );
}

function FeatureCard({ icon, title, description, color }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
}) {
    return (
        <div className="bg-white border border-[#e5e5e7] rounded-xl p-5 hover:shadow-lg transition-shadow">
            <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${color} text-white mb-3`}>
                {icon}
            </div>
            <h3 className="font-bold text-[#1d1d1f] mb-1">{title}</h3>
            <p className="text-sm text-[#86868b]">{description}</p>
        </div>
    );
}
