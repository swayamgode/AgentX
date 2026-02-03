"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Video, Calendar, CheckCircle, Loader2, Play, Edit2, AlertCircle, Wand2, X, Music, Share2, Download, Trash2, Zap, Star, Rocket, Terminal } from "lucide-react";
import { MEME_TEMPLATES, MemeTemplate } from "@/lib/memes";
import { canvasToVideoBlob } from "@/lib/video-converter";
import { renderMemeToVideoBlob } from "@/lib/meme-renderer";
import { useSocialConnection } from "@/hooks/useSocialConnection";
import Link from "next/link";

interface GeneratedMeme {
    id: string;
    templateId: string;
    texts: string[];
    canvas?: HTMLCanvasElement;
    videoBlob?: Blob;
    selected: boolean;
}

type WorkflowStep = 'generate' | 'review' | 'convert' | 'schedule';

export function UnifiedMemeWorkflow() {
    const { status, refresh } = useSocialConnection();
    const [currentStep, setCurrentStep] = useState<WorkflowStep>('generate');
    const [topic, setTopic] = useState("");
    const [quantity, setQuantity] = useState(10);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMemes, setGeneratedMemes] = useState<GeneratedMeme[]>([]);
    const [isConverting, setIsConverting] = useState(false);
    const [conversionProgress, setConversionProgress] = useState(0);
    const [isScheduling, setIsScheduling] = useState(false);
    const [previewMeme, setPreviewMeme] = useState<GeneratedMeme | null>(null);
    const [defaultDesign, setDefaultDesign] = useState<{ templateId: string } | null>(null);

    // Batch Automation State
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [batchLogs, setBatchLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [batchLogs]);

    // Load default design from local storage
    useEffect(() => {
        const saved = localStorage.getItem('memeDefaultDesign');
        if (saved) {
            try {
                setDefaultDesign(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved design");
            }
        }
    }, []);

    const saveAsDefault = (templateId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection
        const design = { templateId };
        setDefaultDesign(design);
        localStorage.setItem('memeDefaultDesign', JSON.stringify(design));
        alert("Design saved as default! You can now use the Quick Generate button.");
    };

    // Step 1: Generate Memes
    const handleGenerate = async (useDefault: boolean = false) => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const payload: any = { topic, count: quantity };

            if (useDefault && defaultDesign) {
                payload.templateId = defaultDesign.templateId;
            }

            const res = await fetch("/api/memes/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.memes) {
                const memes: GeneratedMeme[] = data.memes.map((m: any, i: number) => ({
                    id: `meme-${i}`,
                    templateId: m.templateId,
                    texts: m.texts,
                    selected: true
                }));
                setGeneratedMemes(memes);
                setCurrentStep('review');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    // Step 2: Convert to Videos
    const handleConvertToVideos = async () => {
        setIsConverting(true);
        setCurrentStep('convert');

        const selectedMemes = generatedMemes.filter(m => m.selected);
        let completed = 0;

        for (const meme of selectedMemes) {
            try {
                // Create canvas for this meme
                const canvas = document.createElement('canvas');
                const template = MEME_TEMPLATES.find(t => t.id === meme.templateId);

                if (template) {
                    canvas.width = 1080;
                    canvas.height = 1920; // Reels format
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                        // Draw meme on canvas with proper text rendering
                        const img = new Image();
                        img.crossOrigin = "anonymous";
                        img.src = template.url;

                        await new Promise((resolve) => {
                            img.onload = () => {
                                // Fill background
                                ctx.fillStyle = '#000000';
                                ctx.fillRect(0, 0, 1080, 1920);

                                // Calculate image dimensions to fit in reels format
                                const imgAspect = template.width / template.height;
                                let imgWidth = 1080;
                                let imgHeight = 1080 / imgAspect;

                                // If image is taller than space, fit by height (rare for memes, usually fit width)
                                if (imgHeight > 1920) {
                                    imgHeight = 1920;
                                    imgWidth = 1920 * imgAspect;
                                }

                                const imgX = (1080 - imgWidth) / 2;
                                const imgY = (1920 - imgHeight) / 2;

                                ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

                                // Draw text overlays using template coordinates
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';

                                meme.texts.forEach((text, i) => {
                                    // Safety check for missing text or template data
                                    if (!text || !template.textData[i]) return;

                                    const textPos = template.textData[i];

                                    // Calculate precise position relative to the image on canvas
                                    const x = imgX + (textPos.x / 100) * imgWidth;
                                    const y = imgY + (textPos.y / 100) * imgHeight;

                                    // Font size calculation relative to image width on canvas
                                    let fontSize = (textPos.fontSize / 1000) * imgWidth * (textPos.style === 'impact' ? 1.5 : 1);
                                    let lines: string[] = [];
                                    let lineHeight = 0;
                                    let totalBlockHeight = 0;

                                    // Dynamic Font Scaling Loop
                                    // Reduce font size until text fits reasonably within height constraints
                                    const maxBlockHeight = imgHeight * 0.15; // Limit each text block to 15% of image height (Aggressive)
                                    const minFontSize = 20; // Minimum readable font size

                                    let iterations = 0;
                                    while (iterations < 10) {
                                        ctx.font = `900 ${fontSize}px ${textPos.style === 'impact' ? 'Impact, Arial Black' : 'Arial, Helvetica'}, sans-serif`;
                                        const maxWidth = (textPos.maxWidth ? textPos.maxWidth / 100 : 0.9) * imgWidth;

                                        const words = (textPos.allCaps !== false ? text.toUpperCase() : text).split(' ');
                                        lines = [];
                                        let currentLine = words[0];

                                        for (let j = 1; j < words.length; j++) {
                                            const testLine = currentLine + ' ' + words[j];
                                            const metrics = ctx.measureText(testLine);
                                            if (metrics.width > maxWidth) {
                                                lines.push(currentLine);
                                                currentLine = words[j];
                                            } else {
                                                currentLine = testLine;
                                            }
                                        }
                                        lines.push(currentLine);

                                        lineHeight = fontSize * 1.2;
                                        totalBlockHeight = lines.length * lineHeight;

                                        // Check if fits
                                        if (totalBlockHeight <= maxBlockHeight || fontSize <= minFontSize) {
                                            break;
                                        }

                                        // Reduce and retry
                                        // Reduce and retry AGGRESSIVELY
                                        fontSize *= 0.8;
                                        iterations++;
                                    }

                                    ctx.textAlign = textPos.anchor === 'middle' ? 'center' : textPos.anchor as CanvasTextAlign;
                                    if (textPos.anchor === 'top') ctx.textBaseline = 'top';
                                    else if (textPos.anchor === 'bottom') ctx.textBaseline = 'bottom';
                                    else ctx.textBaseline = 'middle';

                                    // Colors
                                    ctx.fillStyle = textPos.color;
                                    ctx.strokeStyle = textPos.stroke;
                                    ctx.lineWidth = fontSize / 15; // Proportional stroke
                                    ctx.lineJoin = 'round';
                                    ctx.miterLimit = 2;

                                    // Transform for rotation if needed
                                    ctx.save();
                                    ctx.translate(x, y);
                                    if (textPos.rotation) {
                                        ctx.rotate((textPos.rotation * Math.PI) / 180);
                                    }

                                    // Adjust start Y based on anchor for multi-line block center adjustment if needed
                                    let startYOffset = 0;
                                    if (ctx.textBaseline === 'middle') {
                                        startYOffset = -((totalBlockHeight - lineHeight) / 2);
                                    } else if (ctx.textBaseline === 'bottom') {
                                        startYOffset = -(totalBlockHeight - lineHeight);
                                    }

                                    lines.forEach((line, lineIndex) => {
                                        const lineY = startYOffset + (lineIndex * lineHeight);

                                        // Draw stroke first
                                        if (textPos.stroke !== 'transparent') {
                                            ctx.strokeText(line, 0, lineY);
                                        }
                                        // Then fill
                                        ctx.fillText(line, 0, lineY);
                                    });

                                    ctx.restore();
                                });

                                resolve(null);
                            };
                        });

                        // Convert to video - WebM format (browsers don't support MP4 encoding)
                        const rawVideoBlob = await canvasToVideoBlob(canvas, {
                            duration: 10, // Increased to 10s as requested
                            fps: 30,
                            format: 'webm'
                        });

                        // Immediately add audio via API
                        const formData = new FormData();
                        formData.append('video', rawVideoBlob, `meme-${meme.id}.webm`);
                        // Randomly select 'energetic-vibes' or others if we had a selection UI,
                        // for now let the backend pick random trending/upbeat track
                        formData.append('audioId', 'random');

                        try {
                            const audioResponse = await fetch('/api/video/convert', {
                                method: 'POST',
                                body: formData
                            });

                            if (audioResponse.ok) {
                                const mp4Blob = await audioResponse.blob();
                                meme.videoBlob = mp4Blob; // Store the MP4 with audio
                            } else {
                                console.error('Audio mix failed, falling back to silent video');
                                meme.videoBlob = rawVideoBlob;
                            }
                        } catch (err) {
                            console.error('Audio mix error', err);
                            meme.videoBlob = rawVideoBlob;
                        }

                        meme.canvas = canvas;
                    }
                }
            } catch (error) {
                console.error('Conversion error:', error);
            }

            completed++;
            setConversionProgress((completed / selectedMemes.length) * 100);
        }

        setIsConverting(false);
        setCurrentStep('schedule');
    };

    // Step 3: Schedule to YouTube
    const handleSchedule = async () => {
        // Check if YouTube is connected
        if (!status.youtube.connected) {
            alert('Please connect your YouTube account in Settings first!');
            return;
        }

        setIsScheduling(true);

        const selectedMemes = generatedMemes.filter(m => m.selected && m.videoBlob);
        console.log(`Starting upload of ${selectedMemes.length} videos to YouTube...`);

        try {
            let successCount = 0;
            let errors: string[] = [];

            const uploadPromises = selectedMemes.map(async (meme, i) => {
                try {
                    const mp4Blob = meme.videoBlob!;

                    const uploadFormData = new FormData();
                    uploadFormData.append('video', mp4Blob, `meme-${meme.id}.mp4`);
                    uploadFormData.append('title', `${topic} Meme #${i + 1}`);
                    uploadFormData.append('description', `Funny meme about ${topic}\n\nGenerated with AI Meme Studio #shorts #memes`);
                    uploadFormData.append('tags', JSON.stringify([topic, 'meme', 'funny', 'shorts', 'viral']));
                    uploadFormData.append('topic', topic);
                    uploadFormData.append('templateId', meme.templateId);
                    uploadFormData.append('texts', JSON.stringify(meme.texts));

                    const uploadResponse = await fetch('/api/youtube/upload-video', {
                        method: 'POST',
                        body: uploadFormData
                    });

                    const data = await uploadResponse.json();

                    if (uploadResponse.ok) {
                        successCount++;
                        console.log(`✓ Video ${i + 1} uploaded successfully:`, data.videoUrl);
                    } else {
                        console.error(`✗ Video ${i + 1} upload failed:`, data.error);
                        errors.push(`Video ${i + 1}: ${data.error}`);
                    }
                } catch (uploadError: any) {
                    console.error(`✗ Video ${i + 1} error:`, uploadError);
                    errors.push(`Video ${i + 1}: ${uploadError.message}`);
                }
            });

            await Promise.all(uploadPromises);

            if (successCount > 0) {
                const message = successCount === selectedMemes.length
                    ? `🎉 Successfully uploaded all ${successCount} videos to YouTube!`
                    : `✓ Uploaded ${successCount} of ${selectedMemes.length} videos to YouTube.\n\nErrors:\n${errors.join('\n')}`;
                alert(message);
            } else {
                alert(`❌ Failed to upload videos to YouTube.\n\nErrors:\n${errors.join('\n')}`);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsScheduling(false);
        }
    };

    // Step 3b: Schedule to Instagram
    const [isSchedulingInstagram, setIsSchedulingInstagram] = useState(false);

    const handleInstagramUpload = async () => {
        if (!status.instagram.connected) {
            alert('Please connect your Instagram account in Settings first!');
            return;
        }

        setIsSchedulingInstagram(true);
        const selectedMemes = generatedMemes.filter(m => m.selected && m.videoBlob);

        try {
            let successCount = 0;
            let errors: string[] = [];

            // Instagram API has stricter rate limits, so we process serially effectively
            for (let i = 0; i < selectedMemes.length; i++) {
                const meme = selectedMemes[i];
                console.log(`Uploading video ${i + 1} to Intagram...`);

                try {
                    const mp4Blob = meme.videoBlob!;
                    const formData = new FormData();
                    formData.append('video', mp4Blob, `meme-${meme.id}.mp4`);
                    formData.append('caption', `${topic} 😂\n.\n.\n#meme #humor #ai #${topic.replace(/\s+/g, '')}`);
                    formData.append('shareToFeed', 'true');

                    const res = await fetch('/api/instagram/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();

                    if (res.ok && data.success) {
                        successCount++;
                        console.log(`✓ Video ${i + 1} posted to Instagram!`);
                    } else {
                        errors.push(`Video ${i + 1}: ${data.error || 'Unknown error'}`);
                    }
                } catch (e: any) {
                    errors.push(`Video ${i + 1}: ${e.message}`);
                }
            }

            if (successCount > 0) {
                const message = successCount === selectedMemes.length
                    ? `🎉 Successfully posted all ${successCount} videos to Instagram!`
                    : `✓ Posted ${successCount} of ${selectedMemes.length} videos to Instagram.\n\nErrors:\n${errors.join('\n')}`;
                alert(message);
            } else {
                alert(`❌ Failed to post to Instagram.\n\nErrors:\n${errors.join('\n')}`);
            }

        } catch (e: any) {
            alert(`Instagram Upload Error: ${e.message}`);
        } finally {
            setIsSchedulingInstagram(false);
        }
    }


    // --- ONE CLICK BATCH AUTOMATION ---
    const addBatchLog = (msg: string) => {
        setBatchLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    };

    const handleBatchAutoPilot = async () => {
        if (!confirm("Start One-Click Auto Pilot?\n\nThis will:\n1. Read topics from topics.txt\n2. Generate a unique meme for EACH connected YouTube account\n3. Render, add audio, and upload automatically.")) return;

        setIsBatchRunning(true);
        setBatchLogs(["Starting Auto-Pilot..."]);

        try {
            // 1. Fetch Accounts
            addBatchLog("Fetching connected accounts...");
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
                throw new Error("No topics found in topics.txt");
            }

            // Shuffle topics
            topics = topics.sort(() => 0.5 - Math.random());
            addBatchLog(`Loaded ${topics.length} topics. Assigning unique topic to each account.`);

            // 3. Process each account
            for (let i = 0; i < accounts.length; i++) {
                const account = accounts[i];
                const topic = topics[i % topics.length]; // Cycle through topics

                addBatchLog(`\n➡️ Processing Account: ${account.channelName}`);
                addBatchLog(`   Topic: "${topic}"`);

                // A. Generate Meme
                addBatchLog("   Generating content...");
                const genRes = await fetch("/api/memes/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topic, count: 1 })
                });
                const genData = await genRes.json();

                if (!genData.memes || genData.memes.length === 0) {
                    addBatchLog(`   ❌ Failed to generate meme for ${account.channelName}`);
                    continue;
                }

                const memeCandidate = genData.memes[0];

                // B. Render Video
                addBatchLog("   Rendering video...");
                const rawVideoBlob = await renderMemeToVideoBlob(memeCandidate.templateId, memeCandidate.texts);

                if (!rawVideoBlob) {
                    addBatchLog("   ❌ Failed to render video");
                    continue;
                }

                // C. Add Audio
                addBatchLog("   Adding audio...");
                let finalVideoBlob = rawVideoBlob;

                const formData = new FormData();
                formData.append('video', rawVideoBlob, `batch-${account.id}.webm`);
                formData.append('audioId', 'random');

                try {
                    const audioResponse = await fetch('/api/video/convert', {
                        method: 'POST',
                        body: formData
                    });

                    if (audioResponse.ok) {
                        finalVideoBlob = await audioResponse.blob();
                    } else {
                        addBatchLog("   ⚠️ Audio mix failed, using silent video.");
                    }
                } catch (err) {
                    addBatchLog("   ⚠️ Audio mix error, using silent video.");
                }

                // D. Upload
                addBatchLog("   🚀 Uploading to YouTube...");
                const uploadFormData = new FormData();
                uploadFormData.append('video', finalVideoBlob, `meme-${Date.now()}.mp4`);
                uploadFormData.append('title', `${topic} #shorts`);
                uploadFormData.append('description', `Funny meme about ${topic}\n\n#meme #shorts #${topic.replace(/\s/g, '')}`);
                uploadFormData.append('tags', JSON.stringify([topic, 'meme', 'shorts']));
                uploadFormData.append('topic', topic);
                uploadFormData.append('templateId', memeCandidate.templateId);
                uploadFormData.append('texts', JSON.stringify(memeCandidate.texts));
                uploadFormData.append('accountId', account.id); // Targeted Upload
                uploadFormData.append('publishAt', '');

                const uploadResponse = await fetch('/api/youtube/upload-video', {
                    method: 'POST',
                    body: uploadFormData
                });

                const uploadResult = await uploadResponse.json();

                if (uploadResponse.ok) {
                    addBatchLog(`   ✅ SUCCESS! Uploaded to ${account.channelName}`);
                } else {
                    addBatchLog(`   ❌ UPLOAD FAILED: ${uploadResult.error}`);
                }

                // Small delay
                await new Promise(r => setTimeout(r, 2000));
            }

            addBatchLog("\n✨ AUTO-PILOT COMPLETE! ✨");

        } catch (e: any) {
            console.error(e);
            addBatchLog(`CRITICAL ERROR: ${e.message}`);
        } finally {
            setIsBatchRunning(false);
        }
    };


    const toggleMemeSelection = (id: string) => {
        setGeneratedMemes(prev =>
            prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m)
        );
    };

    const selectAll = () => {
        setGeneratedMemes(prev => prev.map(m => ({ ...m, selected: true })));
    };

    const deselectAll = () => {
        setGeneratedMemes(prev => prev.map(m => ({ ...m, selected: false })));
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-3xl md:text-5xl font-black text-[#1d1d1f] tracking-tight">
                    Meme Studio
                </h1>
                <p className="text-lg md:text-xl text-[#86868b] font-light max-w-2xl mx-auto">
                    Create viral, shorts-ready memes for your social media in seconds using AI.
                </p>
            </div>

            {/* Progress Steps */}
            <div className="relative mb-8 md:mb-16">
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />
                <div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 md:justify-between max-w-4xl mx-auto px-4 scrollbar-hide">
                    {[
                        { step: 'generate', label: 'Ideate & Generate', icon: Sparkles },
                        { step: 'review', label: 'Curate Selection', icon: Edit2 },
                        { step: 'convert', label: 'Render Video', icon: Video },
                        { step: 'schedule', label: 'Publish', icon: Calendar }
                    ].map(({ step, label, icon: Icon }, index) => {
                        const isActive = currentStep === step;
                        const isCompleted = ['generate', 'review', 'convert', 'schedule'].indexOf(currentStep) > ['generate', 'review', 'convert', 'schedule'].indexOf(step as any);

                        return (
                            <div key={step} className="flex flex-col items-center gap-4 group shrink-0 min-w-[80px]">
                                <div className={`
                                    w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 relative overflow-hidden
                                    ${isActive || isCompleted
                                        ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white shadow-lg'
                                        : 'border-[#e5e5e7] bg-white text-gray-400 group-hover:border-[#d1d1d6] group-hover:text-gray-600'}
                                `}>
                                    {(isActive || isCompleted) && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent" />
                                    )}
                                    <Icon size={20} className="relative z-10 md:w-6 md:h-6" />
                                </div>
                                <span className={`text-xs md:text-sm font-medium transition-colors ${isActive || isCompleted ? 'text-[#1d1d1f]' : 'text-gray-400'}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="min-h-[600px] relative">
                {/* Step 1: Generate */}
                {currentStep === 'generate' && (
                    <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-white border border-[#e5e5e7] rounded-[2rem] p-10 space-y-10 shadow-sm relative overflow-hidden group">
                            {/* Decorative gradients */}
                            <div className="absolute -top-40 -right-40 w-80 h-80 bg-black/3 rounded-full blur-[100px] group-hover:bg-black/5 transition-colors duration-700" />
                            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-black/3 rounded-full blur-[100px] group-hover:bg-black/5 transition-colors duration-700" />

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
                                        <Wand2 className="text-[#1d1d1f]" size={20} />
                                        Meme Topic
                                    </label>
                                    <div className="relative group/input">
                                        <div className="absolute -inset-0.5 bg-black/10 rounded-2xl blur opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                                        <input
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="What's trending? e.g., 'POV: Senior Dev fixing bugs'..."
                                            className="relative w-full bg-white border border-[#e5e5e7] rounded-xl px-6 py-6 text-xl text-[#1d1d1f] placeholder:text-gray-400 focus:outline-none focus:border-[#1d1d1f] transition-all"
                                            onKeyDown={(e) => e.key === 'Enter' && topic && !isGenerating && handleGenerate(false)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-[#86868b] uppercase tracking-wider ml-1">Quantity</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
                                        {[10, 20, 50].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => setQuantity(num)}
                                                className={`
                                                    relative py-4 md:py-6 rounded-2xl font-bold transition-all border group/btn overflow-hidden
                                                    ${quantity === num
                                                        ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white shadow-lg'
                                                        : 'bg-white border-[#e5e5e7] text-gray-500 hover:bg-[#F5F5F7] hover:border-[#d1d1d6] hover:text-gray-700'}
                                                `}
                                            >
                                                {quantity === num && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-black/0" />
                                                )}
                                                <span className="text-2xl md:text-3xl block mb-1">{num}</span>
                                                <span className="text-[10px] md:text-xs uppercase tracking-widest opacity-60">Memes</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => handleGenerate(false)}
                                        disabled={isGenerating || !topic}
                                        className="w-full group/gen relative overflow-hidden bg-[#1d1d1f] text-white p-1 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        <div className="relative bg-[#1d1d1f] rounded-xl px-8 py-6 transition-all group-hover/gen:bg-[#000]">
                                            <div className="flex items-center justify-center gap-3 text-white font-black text-xl tracking-wide">
                                                {isGenerating ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={28} />
                                                        <span>COOKING...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="group-hover/gen:rotate-12 transition-transform" size={28} />
                                                        <span>GENERATE FRESH</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleGenerate(true)}
                                        disabled={isGenerating || !topic || !defaultDesign}
                                        className={`
                                            w-full group/zap relative overflow-hidden p-1 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed
                                            ${!defaultDesign ? 'opacity-50 grayscale' : 'shadow-md'}
                                        `}
                                    >
                                        <div className="relative bg-white border border-[#e5e5e7] rounded-xl px-8 py-6 transition-all group-hover/zap:bg-[#F5F5F7] h-full flex flex-col justify-center">
                                            <div className="flex items-center justify-center gap-3 text-[#1d1d1f] font-black text-xl tracking-wide">
                                                <Zap className={`fill-current ${isGenerating ? 'animate-pulse' : ''}`} size={28} />
                                                <span>USE SAVED DESIGN</span>
                                            </div>
                                            {!defaultDesign && (
                                                <p className="text-gray-400 text-xs text-center mt-2">Save a design from results first</p>
                                            )}
                                        </div>
                                    </button>
                                </div>

                                {/* BATCH BUTTON */}
                                <div className="pt-2">
                                    <button
                                        onClick={handleBatchAutoPilot}
                                        disabled={isBatchRunning || isGenerating}
                                        className="w-full group/batch relative overflow-hidden p-1 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-md"
                                    >
                                        <div className="relative bg-white border border-[#e5e5e7] rounded-xl px-8 py-4 transition-all group-hover/batch:bg-[#F5F5F7] flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-[#1d1d1f] p-2 rounded-lg">
                                                    <Rocket className={`text-white ${isBatchRunning ? 'animate-bounce' : ''}`} size={24} />
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="text-[#1d1d1f] font-bold text-lg">One-Click Auto Pilot</h3>
                                                    <p className="text-[#86868b] text-xs">Read valid topics.txt • Generate for ALL Accounts • Auto Upload</p>
                                                </div>
                                            </div>
                                            <div className="text-[#1d1d1f]">
                                                {isBatchRunning ? <Loader2 className="animate-spin" /> : <span>Start &rarr;</span>}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Batch Logs Console */}
                                    {(batchLogs.length > 0) && (
                                        <div className="mt-4 bg-white border border-[#e5e5e7] rounded-xl p-4 font-mono text-xs text-[#1d1d1f] h-64 overflow-y-auto shadow-inner">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#e5e5e7] text-[#86868b]">
                                                <Terminal size={12} />
                                                <span>AUTO-PILOT LOGS</span>
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
                    </div>
                )}

                {/* Step 2 & 3: Review & Convert (Unchanged - skipping for brevity in replacement, but I must match exact tool usage) */}
                {/* ... (The tool requires full replacement or smart usage. I will replace everything to be safe) ... */}
                {/* ACTUALLY, I should use smart chunks because the file is big. I will just replace from handleSchedule down to the end of component. */}
                {/* But the prompt says "Replace the entire file content" effectively if I use replace_file_content for large chunks. */}
                {/* I'll use START/END line to just update handleSchedule and the return block. */}

                {/* NO, I'll use ReplaceContent for specific chunks because the instruction says "Add Instagram upload handler". */}
                {/* I will replace the handleSchedule function and the render part for Step 4. */}

                {/* Wait, I can't do multiple disjoint edits in one replace_file_content call easily if I want to insert state variables. 
                   MultiReplaceFileContentToolName is available? Yes "multi_replace_file_content".
                */}


                {/* Step 2: Review */}
                {currentStep === 'review' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between bg-white backdrop-blur-xl p-6 rounded-2xl border border-[#e5e5e7] sticky top-4 z-50 shadow-lg">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold text-[#1d1d1f] flex items-center gap-2">
                                    <CheckCircle className="text-[#1d1d1f]" />
                                    Review & Select
                                </h2>
                                <span className="px-3 py-1 bg-[#F5F5F7] rounded-full text-sm font-medium text-[#86868b]">
                                    {generatedMemes.filter(m => m.selected).length} selected
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={selectAll} className="px-4 py-2 bg-white hover:bg-[#F5F5F7] border border-[#e5e5e7] text-[#1d1d1f] rounded-lg text-sm font-bold transition-colors">
                                    Select All
                                </button>
                                <button onClick={deselectAll} className="px-4 py-2 bg-white hover:bg-[#F5F5F7] border border-[#e5e5e7] text-[#1d1d1f] rounded-lg text-sm font-bold transition-colors">
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6 p-2 md:p-4">
                            {generatedMemes.map(meme => {
                                const template = MEME_TEMPLATES.find(t => t.id === meme.templateId);
                                if (!template) return null;

                                return (
                                    <div
                                        key={meme.id}
                                        onClick={() => toggleMemeSelection(meme.id)}
                                        className={`
                                            relative cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 group
                                            ${meme.selected
                                                ? 'border-[#1d1d1f] scale-105 shadow-xl z-10'
                                                : 'border-[#e5e5e7] hover:border-[#d1d1d6] hover:scale-102 opacity-70 hover:opacity-100'}
                                        `}
                                    >
                                        <div className="aspect-[9/16] relative bg-black flex items-center justify-center overflow-hidden">
                                            {/* Preview Container: 9:16 Aspect Ratio based */}
                                            {/* container-type: inline-size enables cqw units for cleaner scaling */}
                                            <div className="relative w-full" style={{ aspectRatio: `${template.width}/${template.height}`, containerType: 'inline-size' }}>
                                                <img src={template.url} alt={template.name} className="w-full h-full object-contain" />

                                                {/* Text Overlays - Scaled Overlay using percents to match Canvas Logic */}
                                                {meme.texts.map((text, idx) => {
                                                    const textPos = template.textData[idx];
                                                    if (!textPos) return null;

                                                    // Calculate styles matching canvas logic as closely as possible in CSS
                                                    // Note: CSS font-size vs Canvas font-size can vary slightly, but percentages help.
                                                    // Canvas fontSize was relative to image WIDTH (1080 usually).
                                                    // Here container width is 100%. So we use 'container' units or %.

                                                    const isImpact = textPos.style === 'impact';

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="absolute flex items-center justify-center text-center leading-tight pointer-events-none"
                                                            style={{
                                                                left: `${textPos.x}%`,
                                                                top: `${textPos.y}%`,
                                                                transform: `translate(${textPos.anchor === 'middle' ? '-50%' : textPos.anchor === 'right' ? '-100%' : '0'}, ${textPos.anchor === 'middle' ? '-50%' : textPos.anchor === 'bottom' ? '-100%' : '0'}) rotate(${textPos.rotation || 0}deg)`,
                                                                color: textPos.color,
                                                                width: `${textPos.maxWidth || 80}%`,
                                                                // Use viewport-like units or calc based on parent container width if possible.
                                                                // Since parent is fluid, we use standard font mapping.
                                                                // Template fontSize is ~ 1/12 of width for 80px on 1000px width.
                                                                // We'll use a rough multiplier for preview.
                                                                // IMPROVED: Use clamp and smaller base multiplier
                                                                fontSize: `clamp(12px, ${((textPos.fontSize / 10) * (isImpact ? 1.5 : 1)) * 0.8}cqw, 32px)`,
                                                                fontFamily: isImpact ? 'Impact, Arial Black, sans-serif' : 'Arial, Helvetica, sans-serif',
                                                                textShadow: textPos.stroke !== 'transparent'
                                                                    ? `-1px -1px 0 ${textPos.stroke}, 1px -1px 0 ${textPos.stroke}, -1px 1px 0 ${textPos.stroke}, 1px 1px 0 ${textPos.stroke}`
                                                                    : 'none',
                                                                fontWeight: 900,
                                                                textTransform: textPos.allCaps !== false ? 'uppercase' : 'none',
                                                                // Allow wrapping
                                                                wordWrap: 'break-word',
                                                                overflow: 'hidden',
                                                                maxHeight: '15%' // Match canvas logic
                                                            }}
                                                        >
                                                            {text}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {meme.selected && (
                                                <div className="absolute top-3 right-3 bg-[#1d1d1f] rounded-full p-1.5 shadow-lg animate-in zoom-in duration-200 z-20">
                                                    <CheckCircle size={16} className="text-white" />
                                                </div>
                                            )}

                                            {/* Save Default Button */}
                                            <button
                                                onClick={(e) => saveAsDefault(meme.templateId, e)}
                                                className={`
                                                    absolute top-3 left-3 backdrop-blur-md rounded-full p-2 shadow-lg transition-all z-20 
                                                    ${defaultDesign?.templateId === meme.templateId
                                                        ? 'bg-[#1d1d1f] text-white opacity-100 scale-110'
                                                        : 'bg-white/80 text-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white opacity-70 hover:opacity-100'}
                                                `}
                                                title={defaultDesign?.templateId === meme.templateId ? "Current Default Design" : "Set as Default Design"}
                                            >
                                                <Star
                                                    size={16}
                                                    className={defaultDesign?.templateId === meme.templateId ? 'fill-black' : ''}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="sticky bottom-24 md:bottom-8 max-w-xl mx-auto z-40 md:z-50">
                            <button
                                onClick={handleConvertToVideos}
                                disabled={!generatedMemes.some(m => m.selected)}
                                className="w-full bg-white border border-[#e5e5e7] text-[#1d1d1f] p-2 rounded-2xl shadow-lg disabled:opacity-0 transition-all duration-300 transform translate-y-0 disabled:translate-y-10"
                            >
                                <div className="bg-[#1d1d1f] rounded-xl py-4 px-8 flex items-center justify-center gap-3 font-bold text-lg text-white hover:bg-[#000] transition-all">
                                    <Video size={24} />
                                    Convert {generatedMemes.filter(m => m.selected).length} Memes to Videos
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Convert */}
                {currentStep === 'convert' && (
                    <div className="max-w-xl mx-auto pt-20 animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-white border border-[#e5e5e7] p-12 rounded-[2.5rem] text-center space-y-10 shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/3 to-transparent pointer-events-none" />

                            <div className="relative">
                                <div className="w-24 h-24 mx-auto bg-[#F5F5F7] rounded-full flex items-center justify-center mb-6">
                                    <Loader2 className="animate-spin text-[#1d1d1f]" size={48} />
                                </div>
                                <h2 className="text-4xl font-bold text-[#1d1d1f] mb-2">Rendering Magic</h2>
                                <p className="text-[#86868b]">Transforming your ideas into viral videos...</p>
                            </div>

                            <div className="space-y-4">
                                <div className="w-full bg-[#F5F5F7] rounded-full h-4 overflow-hidden p-1 border border-[#e5e5e7]">
                                    <div
                                        className="bg-[#1d1d1f] h-full rounded-full transition-all duration-300 shadow-md"
                                        style={{ width: `${conversionProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-mono text-[#86868b] uppercase tracking-widest">
                                    <span>Progress</span>
                                    <span>{Math.round(conversionProgress)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Schedule */}
                {currentStep === 'schedule' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-bold text-[#1d1d1f]">Ready to Publish</h2>
                            <div className="flex gap-4">
                                {!status.youtube.connected && (
                                    <Link
                                        href="/settings"
                                        className="flex items-center gap-2 bg-[#F5F5F7] hover:bg-[#e5e5e7] text-[#1d1d1f] border border-[#e5e5e7] px-4 py-2 rounded-xl transition-all"
                                    >
                                        <AlertCircle size={18} />
                                        <span>Connect YouTube</span>
                                    </Link>
                                )}
                                {!status.instagram.connected && (
                                    <Link
                                        href="/settings"
                                        className="flex items-center gap-2 bg-[#F5F5F7] hover:bg-[#e5e5e7] text-[#1d1d1f] border border-[#e5e5e7] px-4 py-2 rounded-xl transition-all"
                                    >
                                        <AlertCircle size={18} />
                                        <span>Connect Instagram</span>
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Video Preview Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {generatedMemes.filter(m => m.selected && m.videoBlob).map((meme, i) => {
                                const videoUrl = meme.videoBlob ? URL.createObjectURL(meme.videoBlob) : '';
                                return (
                                    <div key={meme.id} className="bg-white rounded-2xl overflow-hidden border border-[#e5e5e7] group hover:border-[#d1d1d6] transition-all duration-300 hover:shadow-lg">
                                        <div className="aspect-[9/16] bg-black relative">
                                            <video
                                                src={videoUrl}
                                                className="w-full h-full object-contain"
                                                controls
                                                loop

                                                playsInline
                                            />
                                        </div>
                                        <div className="p-4 space-y-3 bg-white border-t border-[#e5e5e7]">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-[#1d1d1f] text-sm font-semibold line-clamp-2 leading-relaxed">
                                                    {meme.texts[0]}
                                                </p>
                                                <span className="text-xs font-mono text-[#86868b] bg-[#F5F5F7] px-2 py-1 rounded">
                                                    #{i + 1}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[#1d1d1f]">
                                                <CheckCircle size={12} />
                                                {meme.videoBlob?.type === 'video/mp4' ? 'Audio Added' : 'Video Ready'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="fixed bottom-24 right-8 left-8 max-w-4xl mx-auto md:left-auto md:w-auto z-40 md:z-50 flex flex-col md:flex-row gap-4 md:bottom-8">
                            {/* YouTube Button */}
                            <button
                                onClick={handleSchedule}
                                disabled={isScheduling || !status.youtube.connected || isSchedulingInstagram}
                                className={`
                                    w-full md:w-auto bg-white text-black rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:grayscale
                                    ${!status.youtube.connected ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <div className="bg-[#1d1d1f] p-1 rounded-2xl">
                                    <div className="bg-white/95 backdrop-blur-md rounded-xl px-8 py-4 flex items-center gap-4">
                                        {isScheduling ? (
                                            <>
                                                <Loader2 className="animate-spin text-[#1d1d1f]" size={24} />
                                                <div className="text-left">
                                                    <div className="text-[#1d1d1f] font-bold">Uploading to YouTube...</div>
                                                    <div className="text-[#86868b] text-xs">Processing...</div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-3 bg-[#1d1d1f] rounded-lg text-white">
                                                    <Share2 size={24} />
                                                </div>
                                                <div className="text-left text-[#1d1d1f]">
                                                    <div className="font-bold text-lg">Post to YouTube</div>
                                                    <div className="text-[#86868b] text-xs">
                                                        Shorts / Reels
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>

                            {/* Instagram Button */}
                            <button
                                onClick={handleInstagramUpload}
                                disabled={isSchedulingInstagram || !status.instagram.connected || isScheduling}
                                className={`
                                    w-full md:w-auto bg-white text-black rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:grayscale
                                    ${!status.instagram.connected ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <div className="bg-[#1d1d1f] p-1 rounded-2xl">
                                    <div className="bg-white/95 backdrop-blur-md rounded-xl px-8 py-4 flex items-center gap-4">
                                        {isSchedulingInstagram ? (
                                            <>
                                                <Loader2 className="animate-spin text-[#1d1d1f]" size={24} />
                                                <div className="text-left">
                                                    <div className="text-[#1d1d1f] font-bold">Posting to Instagram...</div>
                                                    <div className="text-[#86868b] text-xs">Processing via Graph API</div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-3 bg-[#1d1d1f] rounded-lg text-white">
                                                    <Share2 size={24} />
                                                </div>
                                                <div className="text-left text-[#1d1d1f]">
                                                    <div className="font-bold text-lg">Post to Instagram</div>
                                                    <div className="text-[#86868b] text-xs">
                                                        Reels
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
