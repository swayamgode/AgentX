'use client';

import { useState, useRef, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Rocket, Terminal, Loader2, Settings as SettingsIcon, Zap, TrendingUp, Video, Clock } from "lucide-react";

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
    const zoom = 1 + (progress * 0.15); // Zoom from 1.0 to 1.15

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
        // Advanced Mesh Gradient Background
        const t = time / 3000;
        const grad = ctx.createRadialGradient(
            width / 2 + Math.cos(t) * width * 0.3,
            height / 2 + Math.sin(t) * height * 0.3,
            0,
            width / 2,
            height / 2,
            width
        );
        grad.addColorStop(0, config.color1 || '#1a1a1a');
        grad.addColorStop(0.5, config.color2 || '#000000');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Moving highlights
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + Math.sin(t) * 0.01})`;
        ctx.beginPath();
        ctx.arc(width * 0.8, height * 0.2, width * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    // Floating Particles (Premium Feel)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    const particleCount = 15;
    const speed = time / 2500;
    for (let i = 0; i < particleCount; i++) {
        const px = ((Math.sin(i * 123.45) + 1) / 2 * width + Math.cos(speed + i) * 60) % width;
        const py = ((Math.cos(i * 543.21) + 1) / 2 * height - speed * 120 - i * 60) % height;
        const size = (Math.sin(i) + 1) * 2 + 1;
        ctx.beginPath();
        ctx.arc(px, py < 0 ? py + height : py, size, 0, Math.PI * 2);
        ctx.fill();
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
                    const decoY = (height * decoration.y) - (decoSize / 2) + Math.sin(time / 1500 + i) * 15;

                    ctx.globalAlpha = 0.7;
                    ctx.drawImage(canvasToDraw, decoX, decoY, decoSize, decoSize);
                }
            } catch (e) { }
        }
    }

    ctx.globalAlpha = 1.0;

    // 2. Draw Text
    ctx.fillStyle = config.textColor;
    const isStory = width === 1080 && height === 1920;
    const baseFontSize = isStory ? 72 : 55;
    const fontSize = baseFontSize * config.fontSizeScale;

    ctx.font = `bold ${fontSize}px "Outfit", "Inter", sans-serif`;
    ctx.textAlign = config.textAlign;
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 30;

    const maxLineWidth = width * 0.85;
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

    const lineHeight = fontSize * 1.35;
    const totalHeight = lines.length * lineHeight;
    const startY = (height / 2) - (totalHeight / 2);

    const floatY = Math.sin(time / 2000) * 10;

    let textX = width / 2;
    if (config.textAlign === 'left') textX = width * 0.1;
    else if (config.textAlign === 'right') textX = width * 0.9;

    lines.forEach((line, i) => {
        // Premium gradient for first line
        if (i === 0) {
            const tGrad = ctx.createLinearGradient(textX - 150, 0, textX + 150, 0);
                tGrad.addColorStop(0, '#fff');
                tGrad.addColorStop(0.5, '#fcd34d'); // Gold/Amber accent
                tGrad.addColorStop(1, '#fff');
                ctx.fillStyle = tGrad;
        } else {
            ctx.fillStyle = config.textColor;
        }
        ctx.fillText(line, textX, startY + i * lineHeight + floatY);
    });

    // 4. Draw Author
    ctx.font = `italic ${fontSize * 0.45}px "Inter", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(`— ${quote.author}`, width / 2, startY + totalHeight + 70 + floatY);

    // 5. Visual Progress Bar
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, height - 12, width, 12);
    ctx.fillStyle = config.color1 || '#8b5cf6';
    ctx.fillRect(0, height - 12, width * progress, 12);

    // 6. Draw Watermark
    ctx.font = `600 26px "Inter", sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 0;
    ctx.fillText(watermarkText, width / 2, height - 90);
};

const generateVideoBlob = async (quote: Quote, config: RenderConfig, watermarkText: string): Promise<Blob | null> => {
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
            videoBitsPerSecond: 8000000 // 8 Mbps High Quality
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
                await drawCanvas(canvas, quote, elapsed, decorations, config, watermarkText);
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
    const [autoPilotGenerationsPerChannel, setAutoPilotGenerationsPerChannel] = useState(10);
    const [autoPilotBackgroundType, setAutoPilotBackgroundType] = useState<'random' | 'gradient' | 'image'>('gradient');
    const [autoPilotTextAlign, setAutoPilotTextAlign] = useState<'random' | 'left' | 'center' | 'right'>('center');
    
    // Scheduling State
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleStartTime, setScheduleStartTime] = useState(() => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 60); // Default to 1 hour from now
        d.setSeconds(0);
        d.setMilliseconds(0);
        return d.toISOString().slice(0, 16); // format for datetime-local
    });
    const [scheduleInterval, setScheduleInterval] = useState(180); // 3 hours in minutes

    // Batch Automation State
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [batchLogs, setBatchLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [availableGraphics, setAvailableGraphics] = useState<string[]>([]);

    // Execution Delay State
    const [delayUntil, setDelayUntil] = useState<string>('');
    const [isWaitingForDelay, setIsWaitingForDelay] = useState(false);
    const [timeLeftMessage, setTimeLeftMessage] = useState('');

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isWaitingForDelay && delayUntil) {
            timer = setInterval(() => {
                const now = new Date();
                const target = new Date(delayUntil);
                const diff = target.getTime() - now.getTime();

                if (diff <= 0) {
                    setIsWaitingForDelay(false);
                    clearInterval(timer);
                    handleStartAutoPilot();
                } else {
                    const hours = Math.floor(diff / 3600000);
                    const mins = Math.floor((diff % 3600000) / 60000);
                    const secs = Math.floor((diff % 60000) / 1000);
                    setTimeLeftMessage(`⏳ Starting in ${hours}h ${mins}m ${secs}s...`);
                }
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isWaitingForDelay, delayUntil]);

    useEffect(() => {
        // Auto-start if requested via query param
        const searchParams = new URLSearchParams(window.location.search);
        if ((searchParams.get('auto') === 'true' || searchParams.get('automate') === 'true') && !isBatchRunning && !isWaitingForDelay) {
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
        const scheduleInfo = isScheduled 
            ? `\n- Scheduling: ENABLED (Starting ${new Date(scheduleStartTime).toLocaleString()}, every ${scheduleInterval}m)`
            : `\n- Scheduling: DISABLED (Post immediately)`;

        const settingsInfo = `Auto-Pilot Settings:\n- Style: ${autoPilotStyle}\n- Generations per channel: ${autoPilotGenerationsPerChannel}\n- Background: ${autoPilotBackgroundType}\n- Text align: ${autoPilotTextAlign}${scheduleInfo}`;

        const searchParams = new URLSearchParams(window.location.search);
        const isAuto = searchParams.get('auto') === 'true' || searchParams.get('automate') === 'true';

        if (!isAuto && !confirm(`Start Auto-Pilot for Quotes?\n\n${settingsInfo}\n\nThis will:\n1. Read topics from topics.txt\n2. Generate ${autoPilotGenerationsPerChannel} quote(s) for EACH connected YouTube account\n3. Use your configured visual styles\n4. ${isScheduled ? 'Schedule videos on YouTube via publishAt' : 'Upload automatically as #Shorts'}.`)) return;

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
            const quotaExceededAccounts = new Set<string>();
            const accountVideoCount = new Map<string, number>(); // Track videos per account

            // Track videos to generate
            const videosToGenerate: Array<{ account: any; topic: string; videoNum: number; displayNum: number }> = [];

            // Build queue of all videos to generate (Parallel Round-Robin)
            for (let genNum = 0; genNum < autoPilotGenerationsPerChannel; genNum++) {
                for (let i = 0; i < accounts.length; i++) {
                    const account = accounts[i];
                    if (genNum === 0) accountVideoCount.set(account.id, 0); // Initialize counter on first round
                    
                    const topic = topics[topicIndex % topics.length];
                    topicIndex++;
                    videosToGenerate.push({ 
                        account, 
                        topic, 
                        videoNum: genNum, // Use genNum as the "Round Index" for scheduling
                        displayNum: genNum + 1 
                    });
                }
            }

            addBatchLog(`📦 Queue: ${videosToGenerate.length} videos to generate across ${accounts.length} accounts`);

            // Process each video
            for (let i = 0; i < videosToGenerate.length; i++) {
                const { account, topic, videoNum, displayNum } = videosToGenerate[i];

                // Skip if account quota exceeded
                if (quotaExceededAccounts.has(account.id)) {
                    addBatchLog(`\n⏭️  Skipping ${account.channelName} (quota exceeded)`);
                    continue;
                }

                addBatchLog(`\n➡️  Video ${i + 1}/${videosToGenerate.length} (Round ${videoNum + 1}) - ${account.channelName}`);
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

                    const quote: Quote = qData.quotes[0];
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
                    const bgType: 'gradient' | 'image' = 'gradient';
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
                        color1: '#0f172a', // slate-900
                        color2: '#000000', // black
                        textColor: '#ffffff',
                        textAlign: alignment,
                        fontSizeScale: 0.7 + (Math.random() * 0.3) // 0.7 to 1.0
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

                    // Add scheduling if enabled
                    if (isScheduled) {
                        const baseTime = new Date(scheduleStartTime).getTime();
                        // Use videoNum (the Round Index) to group across channels
                        const publishTime = new Date(baseTime + (videoNum * scheduleInterval * 60000));
                        formData.append('publishAt', publishTime.toISOString());
                        addBatchLog(`   📅 Scheduled for: ${publishTime.toLocaleString()} (Round ${videoNum + 1})`);
                    }

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
                    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gradient-to-br from-[#000] to-[#333] rounded-lg">
                                <Rocket className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm md:text-base font-bold text-[#1d1d1f]">
                                    Auto-Pilot
                                </h1>
                                <p className="text-[10px] md:text-xs text-[#86868b]">
                                    Automated content generation and posting
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3 md:py-5 space-y-4">
                    {/* Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <FeatureCard
                            icon={<Zap className="w-3.5 h-3.5" />}
                            title="Smart Generation"
                            description="Automatically generates unique content for each channel"
                            color="from-[#000] to-[#333]"
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-3.5 h-3.5" />}
                            title="Configurable Styles"
                            description="Choose design preferences or let AI randomize"
                            color="from-[#1a1a1a] to-[#000]"
                        />
                        <FeatureCard
                            icon={<Video className="w-3.5 h-3.5" />}
                            title="Bulk Upload"
                            description="Upload multiple videos across all accounts at once"
                            color="from-[#333] to-[#1a1a1a]"
                        />
                    </div>

                    {/* Settings and Control Panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left: Settings */}
                        <div className="space-y-4">
                            <div className="bg-white border border-[#e5e5e7] rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-4">
                                    <SettingsIcon className="text-[#1d1d1f]" size={14} />
                                    <h2 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">Auto-Pilot Settings</h2>
                                </div>

                                <div className="space-y-4">
                                    {/* Style Selection */}
                                    <div>
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                            Design Style
                                        </label>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {(['random', 'inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setAutoPilotStyle(s)}
                                                    className={`py-1.5 px-2 rounded-md font-medium text-[11px] transition-all border ${autoPilotStyle === s
                                                        ? 'bg-black text-white border-black shadow-sm'
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
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                            Generations Per Channel <span className="text-[#1d1d1f] font-mono ml-1">{autoPilotGenerationsPerChannel}</span>
                                        </label>
                                        <div className="bg-[#F5F5F7] rounded-lg px-3 py-3">
                                            <input
                                                type="range"
                                                min="1"
                                                max="50"
                                                value={autoPilotGenerationsPerChannel}
                                                onChange={(e) => setAutoPilotGenerationsPerChannel(parseInt(e.target.value))}
                                                className="w-full accent-black h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, rgb(0, 0, 0) 0%, rgb(0, 0, 0) ${(autoPilotGenerationsPerChannel / 50) * 100}%, rgb(229, 231, 235) ${(autoPilotGenerationsPerChannel / 50) * 100}%, rgb(229, 231, 235) 100%)`
                                                }}
                                            />
                                            <div className="flex justify-between text-[10px] text-[#86868b] mt-1.5 font-mono">
                                                <span>1</span>
                                                <span>50</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Background Type */}
                                    <div>
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                            Background Type
                                        </label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {(['random', 'gradient', 'image'] as const).map(bg => (
                                                <button
                                                    key={bg}
                                                    onClick={() => setAutoPilotBackgroundType(bg)}
                                                    className={`py-1.5 px-2 rounded-md font-medium text-[11px] transition-all border ${autoPilotBackgroundType === bg
                                                        ? 'bg-black text-white border-black shadow-sm'
                                                        : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:bg-[#e5e5e7] hover:text-[#1d1d1f]'
                                                        }`}
                                                >
                                                    {bg === 'random' ? '🎲' : bg === 'gradient' ? '🌈' : '🖼️'}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-[#86868b] mt-1.5">
                                            {autoPilotBackgroundType === 'gradient' && '✓ Using plain black background'}
                                            {autoPilotBackgroundType === 'random' && 'Will randomize between available options'}
                                            {autoPilotBackgroundType === 'image' && 'Will use uploaded background images'}
                                        </p>
                                    </div>

                                    {/* Text Alignment */}
                                    <div>
                                        <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                            Text Alignment
                                        </label>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {(['random', 'left', 'center', 'right'] as const).map(align => (
                                                <button
                                                    key={align}
                                                    onClick={() => setAutoPilotTextAlign(align)}
                                                    className={`py-1.5 px-2 rounded-md font-medium text-[11px] transition-all border ${autoPilotTextAlign === align
                                                        ? 'bg-black text-white border-black shadow-sm'
                                                        : 'bg-[#F5F5F7] text-[#86868b] border-transparent hover:bg-[#e5e5e7] hover:text-[#1d1d1f]'
                                                        }`}
                                                >
                                                    {align === 'random' ? '🎲' : align === 'left' ? '⬅️' : align === 'center' ? '↔️' : '➡️'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Scheduling Options */}
                                    <div className="pt-3 border-t border-[#e5e5e7]">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-[#1d1d1f] block">
                                                    YouTube Native Scheduling
                                                </label>
                                                <p className="text-[10px] text-[#86868b]">Upload now, publish automatically later</p>
                                            </div>
                                            <button
                                                onClick={() => setIsScheduled(!isScheduled)}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isScheduled ? 'bg-black' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isScheduled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        {isScheduled && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                                        First Video Publish Time
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={scheduleStartTime}
                                                        onChange={(e) => setScheduleStartTime(e.target.value)}
                                                        className="w-full bg-[#F5F5F7] border-transparent rounded-md px-3 py-2 text-xs font-medium focus:ring-0 focus:border-black"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                                        Post Interval (Minutes)
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="15"
                                                            max="1440"
                                                            value={scheduleInterval}
                                                            onChange={(e) => setScheduleInterval(parseInt(e.target.value))}
                                                            className="flex-1 bg-[#F5F5F7] border-transparent rounded-md px-3 py-2 text-xs font-medium focus:ring-0 focus:border-black"
                                                        />
                                                        <span className="text-[10px] font-medium text-[#86868b] min-w-[50px]">
                                                            {Math.floor(scheduleInterval / 60)}h {scheduleInterval % 60}m
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Execution Delay Options */}
                                    <div className="pt-3 border-t border-[#e5e5e7]">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <label className="text-[11px] font-bold text-[#1d1d1f] block">
                                                    Delayed Execution
                                                </label>
                                                <p className="text-[10px] text-[#86868b]">Wait for a specific time to start the process</p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (!delayUntil) {
                                                        const d = new Date();
                                                        d.setMinutes(d.getMinutes() + 5);
                                                        setDelayUntil(d.toISOString().slice(0, 16));
                                                    } else {
                                                        setDelayUntil('');
                                                        setIsWaitingForDelay(false);
                                                    }
                                                }}
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${delayUntil ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                            >
                                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${delayUntil ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                            </button>
                                        </div>

                                        {delayUntil && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div>
                                                    <label className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider mb-1.5 block">
                                                        Start Execution At
                                                    </label>
                                                    <input
                                                        type="datetime-local"
                                                        value={delayUntil}
                                                        onChange={(e) => setDelayUntil(e.target.value)}
                                                        disabled={isWaitingForDelay}
                                                        className="w-full bg-[#F5F5F7] border-transparent rounded-md px-3 py-2 text-xs font-medium focus:ring-0 focus:border-black disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Start Button */}
                                    <button
                                        onClick={() => {
                                            if (delayUntil && !isWaitingForDelay) {
                                                setIsWaitingForDelay(true);
                                                addBatchLog(`⏲️ Execution scheduled for ${new Date(delayUntil).toLocaleString()}`);
                                            } else if (isWaitingForDelay) {
                                                setIsWaitingForDelay(false);
                                                addBatchLog(`🛑 Execution schedule cancelled.`);
                                            } else {
                                                handleStartAutoPilot();
                                            }
                                        }}
                                        disabled={isBatchRunning}
                                        className={`w-full font-bold py-2.5 rounded-lg text-xs transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.01] active:scale-[0.99] ${
                                            isWaitingForDelay ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 
                                            isBatchRunning ? 'bg-gray-800 text-white' : 'bg-black hover:bg-[#333] text-white'
                                        }`}
                                    >
                                        {isBatchRunning ? (
                                            <>
                                                <Loader2 className="animate-spin" size={14} />
                                                Auto-Pilot Running...
                                            </>
                                        ) : isWaitingForDelay ? (
                                            <>
                                                <Clock className="animate-pulse" size={14} />
                                                {timeLeftMessage || 'Waiting for scheduled time...'}
                                            </>
                                        ) : (
                                            <>
                                                {delayUntil ? <Clock size={14} /> : <Rocket size={14} />}
                                                {delayUntil ? 'Schedule Execution' : 'Start Auto-Pilot'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Logs */}
                        <div className="space-y-4">
                            <div className="bg-white border border-[#e5e5e7] rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <Terminal className="text-[#1d1d1f]" size={14} />
                                    <h2 className="text-xs font-bold text-[#1d1d1f] uppercase tracking-wider">System Logs</h2>
                                </div>

                                {batchLogs.length > 0 ? (
                                    <div className="bg-[#111] border border-[#333] rounded-lg p-3 font-mono text-[10px] text-[#86868b] h-[400px] overflow-y-auto shadow-inner">
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
                                        <p className="text-xs text-[#86868b]">No logs yet. Start Auto-Pilot to see activity.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="bg-[#F5F5F7] border border-[#e5e5e7] rounded-xl p-4">
                        <h3 className="text-xs font-bold text-[#1d1d1f] mb-2">
                            📚 How Auto-Pilot Works
                        </h3>
                        <ol className="space-y-1.5 text-[11px] text-[#86868b]">
                            <li className="flex gap-1.5">
                                <span className="font-bold text-[#1d1d1f]">1.</span>
                                <span>Configure your preferences above (style, generations per channel, etc.)</span>
                            </li>
                            <li className="flex gap-1.5">
                                <span className="font-bold text-[#1d1d1f]">2.</span>
                                <span>Ensure you have connected YouTube accounts in Settings</span>
                            </li>
                            <li className="flex gap-1.5">
                                <span className="font-bold text-[#1d1d1f]">3.</span>
                                <span>Edit <code className="bg-white px-1.5 py-0.5 rounded border border-[#e5e5e7] text-[10px]">topics.txt</code> to customize content themes</span>
                            </li>
                            <li className="flex gap-1.5">
                                <span className="font-bold text-[#1d1d1f]">4.</span>
                                <span>Click "Start Auto-Pilot" to begin automated generation and upload</span>
                            </li>
                            <li className="flex gap-1.5">
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
        <div className="bg-white border border-[#e5e5e7] rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className={`inline-flex p-1.5 rounded-md bg-gradient-to-br ${color} text-white mb-2`}>
                {icon}
            </div>
            <h3 className="font-bold text-[11px] text-[#1d1d1f] mb-0.5">{title}</h3>
            <p className="text-[10px] text-[#86868b]">{description}</p>
        </div>
    );
}
