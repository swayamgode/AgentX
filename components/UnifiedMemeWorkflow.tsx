"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Video, Calendar, CheckCircle, Loader2, Play, Edit2, AlertCircle } from "lucide-react";
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

                                // If image is taller than space, fit by height
                                if (imgHeight > 1920) {
                                    imgHeight = 1920;
                                    imgWidth = 1920 * imgAspect;
                                }

                                const imgX = (1080 - imgWidth) / 2;
                                const imgY = (1920 - imgHeight) / 2;

                                ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

                                // Draw text overlays with proper wrapping and scaling
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';

                                // Function to wrap text
                                const wrapText = (text: string, maxWidth: number, fontSize: number) => {
                                    ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
                                    const words = text.split(' ');
                                    const lines: string[] = [];
                                    let currentLine = words[0];

                                    for (let i = 1; i < words.length; i++) {
                                        const testLine = currentLine + ' ' + words[i];
                                        const metrics = ctx.measureText(testLine);
                                        if (metrics.width > maxWidth) {
                                            lines.push(currentLine);
                                            currentLine = words[i];
                                        } else {
                                            currentLine = testLine;
                                        }
                                    }
                                    lines.push(currentLine);
                                    return lines;
                                };

                                // Draw each text overlay
                                meme.texts.forEach((text, i) => {
                                    if (!text) return;

                                    const maxWidth = 1000; // Max text width
                                    let fontSize = 80;

                                    // Auto-scale font size if text is too long
                                    if (text.length > 30) fontSize = 60;
                                    if (text.length > 50) fontSize = 50;

                                    const lines = wrapText(text.toUpperCase(), maxWidth, fontSize);

                                    // Position: top or bottom
                                    const lineHeight = fontSize * 1.2;
                                    const totalHeight = lines.length * lineHeight;
                                    const startY = i === 0
                                        ? 150 + (totalHeight / 2)
                                        : 1920 - 150 - (totalHeight / 2);

                                    // Draw each line
                                    lines.forEach((line, lineIndex) => {
                                        const y = startY + (lineIndex - (lines.length - 1) / 2) * lineHeight;

                                        // Draw text with stroke for readability
                                        ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
                                        ctx.strokeStyle = '#000000';
                                        ctx.lineWidth = fontSize / 10;
                                        ctx.lineJoin = 'round';
                                        ctx.miterLimit = 2;

                                        // Multiple stroke passes for better outline
                                        for (let j = 0; j < 3; j++) {
                                            ctx.strokeText(line, 540, y);
                                        }

                                        // Fill text
                                        ctx.fillStyle = '#FFFFFF';
                                        ctx.fillText(line, 540, y);
                                    });
                                });

                                resolve(null);
                            };
                        });

                        // Convert to video - WebM format (browsers don't support MP4 encoding)
                        const videoBlob = await canvasToVideoBlob(canvas, {
                            duration: 6,
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

            // Upload videos to YouTube
            for (let i = 0; i < selectedMemes.length; i++) {
                const meme = selectedMemes[i];
                console.log(`Processing video ${i + 1}/${selectedMemes.length}...`);

                try {
                    // Step 1: Convert WebM to MP4
                    console.log(`Converting video ${i + 1} to MP4...`);
                    const convertFormData = new FormData();
                    convertFormData.append('video', meme.videoBlob!, `meme-${meme.id}.webm`);

                    const convertResponse = await fetch('/api/video/convert', {
                        method: 'POST',
                        body: convertFormData
                    });

                    if (!convertResponse.ok) {
                        const error = await convertResponse.json();
                        throw new Error(`Conversion failed: ${error.error}`);
                    }

                    // Get MP4 blob
                    const mp4Blob = await convertResponse.blob();
                    console.log(`✓ Video ${i + 1} converted to MP4`);

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
        <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between bg-[#16181c] p-4 rounded-2xl border border-[#333]">
                {[
                    { step: 'generate', label: 'Generate', icon: Sparkles },
                    { step: 'review', label: 'Review', icon: Edit2 },
                    { step: 'convert', label: 'Convert', icon: Video },
                    { step: 'schedule', label: 'Schedule', icon: Calendar }
                ].map(({ step, label, icon: Icon }, index) => (
                    <div key={step} className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${currentStep === step ? 'bg-purple-500 text-white' :
                            ['review', 'convert', 'schedule'].indexOf(currentStep) > ['review', 'convert', 'schedule'].indexOf(step as any) ? 'bg-green-500/20 text-green-400' :
                                'bg-[#333] text-[#71767b]'
                            }`}>
                            <Icon size={18} />
                            <span className="font-bold text-sm">{label}</span>
                        </div>
                        {index < 3 && <div className="w-8 h-0.5 bg-[#333]" />}
                    </div>
                ))}
            </div>

            {/* Step 1: Generate */}
            {currentStep === 'generate' && (
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-8 rounded-3xl border border-[#333] shadow-xl space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                            <Sparkles className="text-purple-500" size={28} />
                            Generate Memes with AI
                        </h2>
                        <p className="text-[#71767b]">Enter a topic and let AI create funny memes for you</p>
                    </div>

                    <div className="space-y-4">
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Enter topic (e.g., 'Monday mornings', 'coding bugs')..."
                            className="w-full bg-[#000] border border-[#333] rounded-xl px-4 py-4 text-white text-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                        />

                        <div className="flex gap-3">
                            {[10, 20, 50].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setQuantity(num)}
                                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${quantity === num
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-[#333] text-[#71767b] hover:bg-[#444]'
                                        }`}
                                >
                                    {num} Memes
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Generating {quantity} Memes...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Generate {quantity} Memes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Review */}
            {currentStep === 'review' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Review Generated Memes</h2>
                        <div className="flex gap-2">
                            <button onClick={selectAll} className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg text-sm font-bold">
                                Select All
                            </button>
                            <button onClick={deselectAll} className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded-lg text-sm font-bold">
                                Deselect All
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {generatedMemes.map(meme => {
                            const template = MEME_TEMPLATES.find(t => t.id === meme.templateId);
                            return (
                                <div
                                    key={meme.id}
                                    onClick={() => toggleMemeSelection(meme.id)}
                                    className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${meme.selected ? 'border-purple-500 scale-105' : 'border-[#333] hover:border-[#444]'
                                        }`}
                                >
                                    {template && (
                                        <img src={template.url} alt={template.name} className="w-full aspect-square object-cover" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                                        <p className="text-white text-xs font-bold line-clamp-2">{meme.texts[0]}</p>
                                    </div>
                                    {meme.selected && (
                                        <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                                            <CheckCircle size={20} className="text-white" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleConvertToVideos}
                        disabled={!generatedMemes.some(m => m.selected)}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Video size={20} />
                        Convert {generatedMemes.filter(m => m.selected).length} Memes to Videos
                    </button>
                </div>
            )}

            {/* Step 3: Convert */}
            {currentStep === 'convert' && (
                <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-8 rounded-3xl border border-[#333] shadow-xl space-y-6 text-center">
                    <Loader2 className="animate-spin text-purple-500 mx-auto" size={48} />
                    <h2 className="text-2xl font-bold text-white">Converting to Videos...</h2>
                    <div className="w-full bg-[#333] rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-300"
                            style={{ width: `${conversionProgress}%` }}
                        />
                    </div>
                    <p className="text-[#71767b]">{Math.round(conversionProgress)}% Complete</p>
                </div>
            )}

            {/* Step 4: Schedule */}
            {currentStep === 'schedule' && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Schedule to YouTube</h2>

                    {/* YouTube Connection Warning */}
                    {!status.youtube && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="text-yellow-500 font-bold mb-1">YouTube Not Connected</p>
                                <p className="text-sm text-[#71767b] mb-3">
                                    You need to connect your YouTube account before uploading videos.
                                </p>
                                <Link
                                    href="/settings"
                                    className="inline-block bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    Go to Settings
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {generatedMemes.filter(m => m.selected && m.videoBlob).map(meme => {
                            const videoUrl = meme.videoBlob ? URL.createObjectURL(meme.videoBlob) : '';
                            return (
                                <div key={meme.id} className="bg-[#16181c] rounded-xl overflow-hidden border border-[#333] group">
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
                                    <div className="p-3">
                                        <p className="text-white text-sm font-bold truncate">{meme.texts[0]}</p>
                                        <p className="text-[#71767b] text-xs">Ready to upload</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleSchedule}
                        disabled={isScheduling || !status.youtube}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isScheduling ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Uploading to YouTube...
                            </>
                        ) : !status.youtube ? (
                            <>
                                <AlertCircle size={20} />
                                Connect YouTube First
                            </>
                        ) : (
                            <>
                                <Calendar size={20} />
                                Upload {generatedMemes.filter(m => m.selected && m.videoBlob).length} Videos to YouTube
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
