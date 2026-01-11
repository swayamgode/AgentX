"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Video, Calendar, CheckCircle, Loader2, Play, Edit2, AlertCircle, Wand2, X, Music, Share2, Download, Trash2 } from "lucide-react";
import { MEME_TEMPLATES, MemeTemplate } from "@/lib/memes";
import { canvasToVideoBlob } from "@/lib/video-converter";
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

    // Step 1: Generate Memes
    const handleGenerate = async () => {
        if (!topic) return;
        setIsGenerating(true);
        try {
            const res = await fetch("/api/memes/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, count: quantity })
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
                        const videoBlob = await canvasToVideoBlob(canvas, {
                            duration: 10, // Increased to 10s as requested
                            fps: 30,
                            format: 'webm'
                        });

                        meme.videoBlob = videoBlob;
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
        if (!status.youtube) {
            alert('Please connect your YouTube account in Settings first!');
            return;
        }

        setIsScheduling(true);

        const selectedMemes = generatedMemes.filter(m => m.selected && m.videoBlob);
        console.log(`Starting upload of ${selectedMemes.length} videos...`);

        try {
            let successCount = 0;
            let errors: string[] = [];

            // Convert and upload videos to YouTube
            for (let i = 0; i < selectedMemes.length; i++) {
                const meme = selectedMemes[i];
                console.log(`Processing video ${i + 1}/${selectedMemes.length}...`);

                try {
                    // Step 1: Convert WebM to MP4 with audio
                    console.log(`Converting video ${i + 1} to MP4 with audio...`);
                    const convertFormData = new FormData();
                    convertFormData.append('video', meme.videoBlob!, `meme-${meme.id}.webm`);

                    const convertResponse = await fetch('/api/video/convert', {
                        method: 'POST',
                        body: convertFormData
                    });

                    if (!convertResponse.ok) {
                        const error = await convertResponse.json();
                        throw new Error(`Conversion failed: ${error.error || 'Unknown error'}`);
                    }

                    // Get MP4 blob with audio
                    const mp4Blob = await convertResponse.blob();
                    console.log(`✓ Video ${i + 1} converted to MP4 with audio`);

                    // Step 2: Upload MP4 to YouTube
                    console.log(`Uploading video ${i + 1} to YouTube...`);
                    const uploadFormData = new FormData();
                    uploadFormData.append('video', mp4Blob, `meme-${meme.id}.mp4`);
                    uploadFormData.append('title', `${topic} Meme #${i + 1}`);
                    uploadFormData.append('description', `Funny meme about ${topic}\n\nGenerated with AI Meme Studio`);
                    uploadFormData.append('tags', JSON.stringify([topic, 'meme', 'funny', 'shorts']));

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
            }

            // Show results
            if (successCount > 0) {
                const message = successCount === selectedMemes.length
                    ? `🎉 Successfully uploaded all ${successCount} videos to YouTube!`
                    : `✓ Uploaded ${successCount} of ${selectedMemes.length} videos.\n\nErrors:\n${errors.join('\n')}`;
                alert(message);

                if (successCount === selectedMemes.length) {
                    // Reset workflow on complete success
                    setGeneratedMemes([]);
                    setCurrentStep('generate');
                    setTopic('');
                }
            } else {
                alert(`❌ Failed to upload all videos.\n\nErrors:\n${errors.join('\n')}\n\nPlease check:\n1. YouTube is connected in Settings\n2. Your YouTube account has upload permissions\n3. Video format is supported`);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message || 'Unknown error'}.\n\nPlease check your YouTube connection in Settings.`);
        } finally {
            setIsScheduling(false);
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
                <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 tracking-tight">
                    Meme Studio
                </h1>
                <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
                    Create viral, shorts-ready memes for your social media in seconds using AI.
                </p>
            </div>

            {/* Progress Steps */}
            <div className="relative mb-16">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />
                <div className="flex justify-between max-w-4xl mx-auto px-4">
                    {[
                        { step: 'generate', label: 'Ideate & Generate', icon: Sparkles },
                        { step: 'review', label: 'Curate Selection', icon: Edit2 },
                        { step: 'convert', label: 'Render Video', icon: Video },
                        { step: 'schedule', label: 'Publish', icon: Calendar }
                    ].map(({ step, label, icon: Icon }, index) => {
                        const isActive = currentStep === step;
                        const isCompleted = ['generate', 'review', 'convert', 'schedule'].indexOf(currentStep) > ['generate', 'review', 'convert', 'schedule'].indexOf(step as any);

                        return (
                            <div key={step} className="flex flex-col items-center gap-4 group">
                                <div className={`
                                    w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 relative overflow-hidden
                                    ${isActive || isCompleted
                                        ? 'border-purple-500 bg-purple-500/10 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                                        : 'border-white/10 bg-[#0a0a0a] text-gray-600 group-hover:border-white/30 group-hover:text-gray-400'}
                                `}>
                                    {(isActive || isCompleted) && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent" />
                                    )}
                                    <Icon size={24} className="relative z-10" />
                                </div>
                                <span className={`text-sm font-medium transition-colors ${isActive || isCompleted ? 'text-white' : 'text-gray-600'}`}>
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
                        <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 space-y-10 shadow-2xl relative overflow-hidden group">
                            {/* Decorative gradients */}
                            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] group-hover:bg-purple-500/30 transition-colors duration-700" />
                            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px] group-hover:bg-pink-500/30 transition-colors duration-700" />

                            <div className="space-y-6 relative z-10">
                                <div className="space-y-2">
                                    <label className="text-lg font-bold text-white flex items-center gap-2">
                                        <Wand2 className="text-purple-400" size={20} />
                                        Meme Topic
                                    </label>
                                    <div className="relative group/input">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                                        <input
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="What's trending? e.g., 'POV: Senior Dev fixing bugs'..."
                                            className="relative w-full bg-[#050505] border border-white/10 rounded-xl px-6 py-6 text-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-transparent focus:ring-0 transition-all shadow-inner"
                                            onKeyDown={(e) => e.key === 'Enter' && topic && !isGenerating && handleGenerate()}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-gray-400 uppercase tracking-wider ml-1">Quantity</label>
                                    <div className="grid grid-cols-3 gap-6">
                                        {[10, 20, 50].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => setQuantity(num)}
                                                className={`
                                                    relative py-6 rounded-2xl font-bold transition-all border group/btn overflow-hidden
                                                    ${quantity === num
                                                        ? 'bg-purple-500/10 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                                                        : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/20 hover:text-gray-300'}
                                                `}
                                            >
                                                {quantity === num && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
                                                )}
                                                <span className="text-3xl block mb-1">{num}</span>
                                                <span className="text-xs uppercase tracking-widest opacity-60">Memes</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !topic}
                                        className="w-full group/gen relative overflow-hidden bg-white text-black p-1 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                                    >
                                        <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl px-8 py-6 transition-all group-hover/gen:opacity-90">
                                            <div className="flex items-center justify-center gap-3 text-white font-black text-xl tracking-wide">
                                                {isGenerating ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={28} />
                                                        <span>COOKING M AGIC...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="group-hover/gen:rotate-12 transition-transform" size={28} />
                                                        <span>GENERATE MAGIC MEMES</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Review */}
                {currentStep === 'review' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-white/10 sticky top-4 z-50 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <CheckCircle className="text-purple-500" />
                                    Review & Select
                                </h2>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium text-gray-300">
                                    {generatedMemes.filter(m => m.selected).length} selected
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={selectAll} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-bold transition-colors">
                                    Select All
                                </button>
                                <button onClick={deselectAll} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-bold transition-colors">
                                    Deselect All
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-4">
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
                                                ? 'border-purple-500 scale-105 shadow-[0_0_30px_rgba(168,85,247,0.3)] z-10'
                                                : 'border-transparent hover:border-white/20 hover:scale-102 opacity-70 hover:opacity-100'}
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
                                                <div className="absolute top-3 right-3 bg-purple-500 rounded-full p-1.5 shadow-lg animate-in zoom-in duration-200 z-20">
                                                    <CheckCircle size={16} className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="sticky bottom-8 max-w-xl mx-auto z-50">
                            <button
                                onClick={handleConvertToVideos}
                                disabled={!generatedMemes.some(m => m.selected)}
                                className="w-full bg-[#0a0a0a] border border-white/10 text-white p-2 rounded-2xl shadow-2xl disabled:opacity-0 transition-all duration-300 transform translate-y-0 disabled:translate-y-10"
                            >
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl py-4 px-8 flex items-center justify-center gap-3 font-bold text-lg hover:brightness-110 transition-all">
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
                        <div className="bg-[#0a0a0a] border border-white/10 p-12 rounded-[2.5rem] text-center space-y-10 shadow-[0_0_100px_rgba(168,85,247,0.1)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

                            <div className="relative">
                                <div className="w-24 h-24 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                                    <Loader2 className="animate-spin text-purple-500" size={48} />
                                </div>
                                <h2 className="text-4xl font-bold text-white mb-2">Rendering Magic</h2>
                                <p className="text-gray-400">Transforming your ideas into viral videos...</p>
                            </div>

                            <div className="space-y-4">
                                <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden p-1 border border-white/5">
                                    <div
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                        style={{ width: `${conversionProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-mono text-gray-500 uppercase tracking-widest">
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
                            <h2 className="text-3xl font-bold text-white">Ready to Publish</h2>
                            {!status.youtube && (
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-4 py-2 rounded-xl transition-all"
                                >
                                    <AlertCircle size={18} />
                                    <span>Connect YouTube to Upload</span>
                                </Link>
                            )}
                        </div>

                        {/* Video Preview Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {generatedMemes.filter(m => m.selected && m.videoBlob).map((meme, i) => {
                                const videoUrl = meme.videoBlob ? URL.createObjectURL(meme.videoBlob) : '';
                                return (
                                    <div key={meme.id} className="bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 group hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl">
                                        <div className="aspect-[9/16] bg-black relative">
                                            <video
                                                src={videoUrl}
                                                className="w-full h-full object-contain"
                                                controls
                                                loop
                                                muted
                                                playsInline
                                            />
                                        </div>
                                        <div className="p-4 space-y-3 bg-[#111]">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-white text-sm font-semibold line-clamp-2 leading-relaxed">
                                                    {meme.texts[0]}
                                                </p>
                                                <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                                                    #{i + 1}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-green-400">
                                                <CheckCircle size={12} />
                                                Video Optimized
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="fixed bottom-8 right-8 left-8 max-w-4xl mx-auto md:left-auto md:w-auto z-50">
                            <button
                                onClick={handleSchedule}
                                disabled={isScheduling || !status.youtube}
                                className={`
                                    w-full md:w-auto bg-white text-black rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:grayscale
                                    ${!status.youtube ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-1 rounded-2xl">
                                    <div className="bg-black/80 backdrop-blur-md rounded-xl px-8 py-4 flex items-center gap-4">
                                        {isScheduling ? (
                                            <>
                                                <Loader2 className="animate-spin text-white" size={24} />
                                                <div className="text-left">
                                                    <div className="text-white font-bold">Uploading to YouTube...</div>
                                                    <div className="text-purple-300 text-xs">Please wait while we publish</div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-3 bg-purple-500 rounded-lg text-white">
                                                    <Share2 size={24} />
                                                </div>
                                                <div className="text-left text-white">
                                                    <div className="font-bold text-lg">Upload to YouTube Shorts</div>
                                                    <div className="text-gray-400 text-xs">
                                                        {generatedMemes.filter(m => m.selected && m.videoBlob).length} videos ready to go
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
        </div>
    );
}
