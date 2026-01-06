"use client";

import { useState, useRef, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Download, Image as ImageIcon, Sparkles, RefreshCw, Grid, Share2, Video, Film } from "lucide-react";
import { MEME_TEMPLATES, MemeTemplate } from "@/lib/memes";
import { PostingModal } from "@/components/PostingModal";
import { SocialMediaConnect } from "@/components/SocialMediaConnect";
import { canvasToVideoBlob, downloadVideoBlob } from "@/lib/video-converter";
import { VideoTemplateSelector } from "@/components/VideoTemplateSelector";
import { AudioSelector } from "@/components/AudioSelector";
import { VideoEditor } from "@/components/VideoEditor";
import { VideoTemplate, VIDEO_TEMPLATES } from "@/lib/video-templates";
import { AudioTrack } from "@/lib/audio-library";
import { BulkMemeGenerator } from "@/components/BulkMemeGenerator";

// Sub-component to render a single meme thumbnail
function MemeThumbnail({
    template,
    texts,
    onClick
}: {
    template: MemeTemplate;
    texts: string[];
    onClick: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = template.url;
        img.onload = () => {
            canvas.width = 300; // Thumbnail size
            canvas.height = (template.height / template.width) * 300;

            // Draw Image
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Helper function to wrap text
            const wrapText = (text: string, maxWidth: number): string[] => {
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

            const scale = canvas.width / template.width;

            template.textData.forEach((textConfig, i) => {
                const content = texts[i] || "";
                if (!content) return;

                let fontSize = textConfig.fontSize * scale;
                const isImpact = textConfig.style === "impact";

                const setFont = (size: number) => {
                    ctx.font = isImpact
                        ? `900 ${size}px Impact, Anton, sans-serif`
                        : `700 ${size}px Arial, sans-serif`;
                };

                setFont(fontSize);

                ctx.fillStyle = textConfig.color;
                ctx.strokeStyle = textConfig.stroke;
                ctx.lineWidth = isImpact ? 2 : 1; // Thinner for thumbnails
                ctx.textAlign = "center";
                ctx.lineJoin = "round";

                const x = canvas.width * (textConfig.x / 100);
                const y = canvas.height * (textConfig.y / 100);

                ctx.save();
                ctx.translate(x, y);
                if (textConfig.rotation) ctx.rotate((textConfig.rotation * Math.PI) / 180);

                const textToDraw = textConfig.allCaps !== false ? content.toUpperCase() : content;
                ctx.textBaseline = textConfig.anchor === "middle" ? "middle" : textConfig.anchor === "bottom" ? "bottom" : "top";

                // Calculate max width for text
                const maxWidth = textConfig.maxWidth
                    ? (canvas.width * textConfig.maxWidth / 100)
                    : canvas.width * 0.9;

                // Wrap text into multiple lines
                let lines = wrapText(textToDraw, maxWidth);

                // Scale down font if wrapped text is still too wide
                let scaleFactor = 1;
                let attempts = 0;
                while (attempts < 10) {
                    let maxLineWidth = 0;
                    for (const line of lines) {
                        const metrics = ctx.measureText(line);
                        maxLineWidth = Math.max(maxLineWidth, metrics.width);
                    }

                    if (maxLineWidth <= maxWidth) break;

                    scaleFactor *= 0.9;
                    const newFontSize = Math.floor(fontSize * scaleFactor);
                    setFont(newFontSize);
                    ctx.lineWidth = isImpact ? 2 : 1;
                    lines = wrapText(textToDraw, maxWidth);
                    attempts++;
                }

                // Calculate line height
                const lineHeight = fontSize * scaleFactor * 1.2;

                // Adjust starting Y position based on number of lines and anchor
                let startY = 0;
                if (textConfig.anchor === "middle") {
                    startY = -(lines.length - 1) * lineHeight / 2;
                } else if (textConfig.anchor === "bottom") {
                    startY = -(lines.length - 1) * lineHeight;
                }

                // Draw each line
                lines.forEach((line, lineIndex) => {
                    const lineY = startY + (lineIndex * lineHeight);

                    if (textConfig.stroke !== "transparent") {
                        ctx.strokeText(line, 0, lineY);
                    }
                    ctx.fillText(line, 0, lineY);
                });

                ctx.restore();
            });
        };
    }, [template, texts]);

    return (
        <div onClick={onClick} className="cursor-pointer hover:scale-105 transition-transform">
            <canvas ref={canvasRef} className="w-full h-auto rounded-lg shadow-md border border-[#333]" />
        </div>
    );
}

export default function MemePage() {
    const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate>(MEME_TEMPLATES[0]);
    const [textInputs, setTextInputs] = useState<string[]>(Array(MEME_TEMPLATES[0].boxCount).fill(""));
    const [format, setFormat] = useState<'square' | 'reels'>('square');

    // AI State
    const [aiTopic, setAiTopic] = useState("");
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [generatedMemes, setGeneratedMemes] = useState<{ templateId: string; texts: string[] }[]>([]);

    // Posting State
    const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [showSocialConnect, setShowSocialConnect] = useState(false);

    // Tab State
    const [activeTab, setActiveTab] = useState<'image' | 'video' | 'bulk'>('image'); // Added 'bulk'

    // Video Meme State
    const [selectedVideoTemplate, setSelectedVideoTemplate] = useState<VideoTemplate>(VIDEO_TEMPLATES[0]);
    const [selectedAudio, setSelectedAudio] = useState<AudioTrack | null>(null);
    const [videoAiTopic, setVideoAiTopic] = useState("");
    const [isVideoAiGenerating, setIsVideoAiGenerating] = useState(false);
    const [generatedVideoMemes, setGeneratedVideoMemes] = useState<{ templateId: string; textOverlays: { id: string; text: string }[] }[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Update text inputs when template changes
    useEffect(() => {
        // Preserve existing texts if they fit, otherwise slice or fill
        setTextInputs(prev => {
            const newLength = selectedTemplate.boxCount;
            if (prev.length >= newLength) return prev.slice(0, newLength);
            return [...prev, ...Array(newLength - prev.length).fill("")];
        });
    }, [selectedTemplate]);

    // Helper function to wrap text
    const wrapText = (
        ctx: CanvasRenderingContext2D,
        text: string,
        maxWidth: number
    ): string[] => {
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

    // Main Canvas Drawing Logic
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = selectedTemplate.url;

        image.onload = () => {
            if (format === 'reels') {
                // Reels format: 1080x1920 (9:16)
                canvas.width = 1080;
                canvas.height = 1920;

                // Fill background with dark gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
                gradient.addColorStop(0, '#0a0a0a');
                gradient.addColorStop(0.5, '#1a1a1a');
                gradient.addColorStop(1, '#0a0a0a');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 1080, 1920);

                // Calculate meme dimensions (centered, max 1080x1080)
                const memeAspect = selectedTemplate.width / selectedTemplate.height;
                let memeWidth = 1080;
                let memeHeight = 1080;

                if (memeAspect > 1) {
                    // Landscape - fit width
                    memeHeight = 1080 / memeAspect;
                } else if (memeAspect < 1) {
                    // Portrait - fit height
                    memeWidth = 1080 * memeAspect;
                }

                // Center the meme vertically
                const memeX = (1080 - memeWidth) / 2;
                const memeY = (1920 - memeHeight) / 2;

                ctx.drawImage(image, memeX, memeY, memeWidth, memeHeight);

                // Store meme position for text rendering
                (canvas as any).memeOffset = { x: memeX, y: memeY, width: memeWidth, height: memeHeight };
            } else {
                // Square format (original)
                canvas.width = selectedTemplate.width;
                canvas.height = selectedTemplate.height;
                ctx.drawImage(image, 0, 0);
            }

            selectedTemplate.textData.forEach((textConfig, i) => {
                const content = textInputs[i] || "";

                if (!content) return;

                ctx.save();

                // Font Settings
                let fontSize = textConfig.fontSize;
                const isImpact = textConfig.style === "impact";

                // Set initial font
                const setFont = (size: number) => {
                    ctx.font = isImpact
                        ? `900 ${size}px Impact, Anton, sans-serif`
                        : `700 ${size}px Arial, sans-serif`;
                };

                setFont(fontSize);

                ctx.fillStyle = textConfig.color;
                ctx.strokeStyle = textConfig.stroke;
                ctx.lineWidth = isImpact ? Math.floor(fontSize * 0.1) : Math.floor(fontSize * 0.05);
                ctx.textAlign = "center";
                ctx.lineJoin = "round";

                // Position
                let x, y;
                if (format === 'reels' && (canvas as any).memeOffset) {
                    // Adjust text position for reels format
                    const offset = (canvas as any).memeOffset;
                    x = offset.x + (offset.width * (textConfig.x / 100));
                    y = offset.y + (offset.height * (textConfig.y / 100));
                } else {
                    x = canvas.width * (textConfig.x / 100);
                    y = canvas.height * (textConfig.y / 100);
                }

                ctx.translate(x, y);

                // Rotation
                if (textConfig.rotation) {
                    ctx.rotate((textConfig.rotation * Math.PI) / 180);
                }

                const textToDraw = textConfig.allCaps !== false ? content.toUpperCase() : content;
                ctx.textBaseline = textConfig.anchor === "middle" ? "middle" : textConfig.anchor === "bottom" ? "bottom" : "top";

                // Calculate max width for text
                let maxWidth;
                if (format === 'reels' && (canvas as any).memeOffset) {
                    const offset = (canvas as any).memeOffset;
                    maxWidth = textConfig.maxWidth
                        ? (offset.width * textConfig.maxWidth / 100)
                        : offset.width * 0.9;
                } else {
                    maxWidth = textConfig.maxWidth
                        ? (canvas.width * textConfig.maxWidth / 100)
                        : canvas.width * 0.9;
                }

                // Wrap text into multiple lines
                let lines = wrapText(ctx, textToDraw, maxWidth);

                // Scale down font if wrapped text is still too wide
                let scaleFactor = 1;
                let attempts = 0;
                while (attempts < 10) {
                    let maxLineWidth = 0;
                    for (const line of lines) {
                        const metrics = ctx.measureText(line);
                        maxLineWidth = Math.max(maxLineWidth, metrics.width);
                    }

                    if (maxLineWidth <= maxWidth) break;

                    scaleFactor *= 0.9;
                    const newFontSize = Math.floor(fontSize * scaleFactor);
                    setFont(newFontSize);
                    ctx.lineWidth = isImpact ? Math.floor(newFontSize * 0.1) : Math.floor(newFontSize * 0.05);
                    lines = wrapText(ctx, textToDraw, maxWidth);
                    attempts++;
                }

                // Calculate line height
                const lineHeight = fontSize * scaleFactor * 1.2;

                // Adjust starting Y position based on number of lines and anchor
                let startY = 0;
                if (textConfig.anchor === "middle") {
                    startY = -(lines.length - 1) * lineHeight / 2;
                } else if (textConfig.anchor === "bottom") {
                    startY = -(lines.length - 1) * lineHeight;
                }

                // Draw each line
                lines.forEach((line, lineIndex) => {
                    const lineY = startY + (lineIndex * lineHeight);

                    if (textConfig.stroke !== "transparent") {
                        ctx.strokeText(line, 0, lineY);
                    }
                    ctx.fillText(line, 0, lineY);
                });

                ctx.restore();
            });
        };
    }, [selectedTemplate, textInputs]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        try {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            const link = document.createElement("a");
            const formatSuffix = format === 'reels' ? 'reels' : 'square';
            link.download = `meme-${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}-${formatSuffix}-${Date.now()}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerateVideo = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsGeneratingVideo(true);
        try {
            // Generate video from canvas
            const blob = await canvasToVideoBlob(canvas, {
                duration: 5,
                fps: 30,
                format: 'webm',
            });
            setVideoBlob(blob);
            setIsPostingModalOpen(true);
        } catch (error) {
            console.error('Failed to generate video:', error);
            alert('Failed to generate video. Please try downloading the image instead.');
        } finally {
            setIsGeneratingVideo(false);
        }
    };

    const handleDownloadVideo = () => {
        if (videoBlob) {
            const formatSuffix = format === 'reels' ? 'reels' : 'square';
            downloadVideoBlob(videoBlob, `meme-${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}-${formatSuffix}-${Date.now()}.webm`);
        }
    };

    const handleAiGenerate = async () => {
        if (!aiTopic) return;
        setIsAiGenerating(true);
        setGeneratedMemes([]); // clear previous
        try {
            const res = await fetch("/api/memes/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: aiTopic, count: 6 })
            });
            const data = await res.json();
            if (data.memes) {
                setGeneratedMemes(data.memes);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsAiGenerating(false);
        }
    };

    const loadGeneratedMeme = (meme: { templateId: string, texts: string[] }) => {
        const template = MEME_TEMPLATES.find(t => t.id === meme.templateId);
        if (template) {
            setSelectedTemplate(template);
            setTextInputs(meme.texts);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleVideoAiGenerate = async () => {
        if (!videoAiTopic) return;
        setIsVideoAiGenerating(true);
        setGeneratedVideoMemes([]);
        try {
            const res = await fetch("/api/memes/generate-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic: videoAiTopic, count: 6 })
            });
            const data = await res.json();
            if (data.memes) {
                setGeneratedVideoMemes(data.memes);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsVideoAiGenerating(false);
        }
    };

    const loadGeneratedVideoMeme = (meme: { templateId: string; textOverlays: { id: string; text: string }[] }) => {
        const template = VIDEO_TEMPLATES.find(t => t.id === meme.templateId);
        if (template) {
            setSelectedVideoTemplate(template);
            // Update VideoEditor will need to accept these overlays
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="flex min-h-screen bg-black text-[#e7e9ea]">
            <LeftSidebar />

            <main className="flex-1 border-x border-[#333] min-h-screen flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#333]">
                    <div className="p-4 flex items-center justify-between">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="text-purple-500" /> Meme Studio
                        </h1>
                        <div className="flex gap-2 bg-[#16181c] rounded-lg p-1 border border-[#333]">
                            <button
                                onClick={() => setFormat('square')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${format === 'square'
                                    ? 'bg-white text-black'
                                    : 'text-[#71767b] hover:text-white'
                                    }`}
                            >
                                Square
                            </button>
                            <button
                                onClick={() => setFormat('reels')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${format === 'reels'
                                    ? 'bg-white text-black'
                                    : 'text-[#71767b] hover:text-white'
                                    }`}
                            >
                                Reels
                            </button>
                        </div>
                    </div>

                    {/* Modern Segmented Control Tabs */}
                    <div className="px-4 pb-4">
                        <div className="flex p-1 bg-[#16181c] border border-[#333] rounded-xl relative">
                            {/* Sliding Background (Visual only - handled by state styles) */}
                            {activeTab === 'image' && (
                                <div className="absolute left-1 top-1 bottom-1 w-[calc(33.33%-4px)] bg-[#333] rounded-lg border border-[#444] shadow-sm transition-all duration-300" />
                            )}
                            {activeTab === 'video' && (
                                <div className="absolute left-[calc(33.33%)] top-1 bottom-1 w-[calc(33.33%)] bg-[#333] rounded-lg border border-[#444] shadow-sm transition-all duration-300" />
                            )}
                            {activeTab === 'bulk' && (
                                <div className="absolute right-1 top-1 bottom-1 w-[calc(33.33%-4px)] bg-[#333] rounded-lg border border-[#444] shadow-sm transition-all duration-300" />
                            )}

                            <button
                                onClick={() => setActiveTab('image')}
                                className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors rounded-lg flex items-center justify-center gap-2 ${activeTab === 'image' ? 'text-white' : 'text-[#71767b] hover:text-[#a1a1aa]'}`}
                            >
                                <ImageIcon size={16} />
                                Image Memes
                            </button>
                            <button
                                onClick={() => setActiveTab('video')}
                                className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors rounded-lg flex items-center justify-center gap-2 ${activeTab === 'video' ? 'text-white' : 'text-[#71767b] hover:text-[#a1a1aa]'}`}
                            >
                                <Video size={16} />
                                Video Memes
                            </button>
                            <button
                                onClick={() => setActiveTab('bulk')}
                                className={`relative z-10 flex-1 py-2 text-sm font-bold transition-colors rounded-lg flex items-center justify-center gap-2 ${activeTab === 'bulk' ? 'text-white' : 'text-[#71767b] hover:text-[#a1a1aa]'}`}
                            >
                                <Sparkles size={16} className={activeTab === 'bulk' ? 'text-purple-400' : ''} />
                                Auto Schedule
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-8 pb-32">
                    {/* Image Memes Tab */}
                    {activeTab === 'image' && (
                        <>

                            {/* Editor Section */}
                            <div className="space-y-6">

                                {/* Hidden canvas for rendering - preview shown in PreviewPanel */}
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Inputs */}
                                <div className="space-y-3 bg-[#16181c] p-4 rounded-2xl border border-[#333]">
                                    {selectedTemplate.textData.map((pos, idx) => (
                                        <div key={pos.id}>
                                            <label className="text-xs font-bold text-[#71767b] mb-1 block">TEXT {idx + 1}</label>
                                            <input
                                                type="text"
                                                value={textInputs[idx] || ""}
                                                onChange={(e) => {
                                                    const newTexts = [...textInputs];
                                                    newTexts[idx] = e.target.value;
                                                    setTextInputs(newTexts);
                                                }}
                                                className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                                                placeholder={`Text for ${pos.id}...`}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setTextInputs(Array(selectedTemplate.boxCount).fill(""))}
                                            className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw size={18} /> Reset
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Download size={18} /> Download
                                        </button>
                                    </div>

                                    {format === 'reels' && (
                                        <button
                                            onClick={handleGenerateVideo}
                                            disabled={isGeneratingVideo}
                                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isGeneratingVideo ? (
                                                <>
                                                    <Video className="animate-pulse" size={18} />
                                                    Generating Video...
                                                </>
                                            ) : (
                                                <>
                                                    <Share2 size={18} />
                                                    Share to YouTube & Instagram
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <hr className="border-[#333]" />

                            {/* Social Media Connections */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowSocialConnect(!showSocialConnect)}
                                    className="w-full flex items-center justify-between p-4 bg-[#16181c] border border-[#333] rounded-xl hover:border-[#444] transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Share2 className="text-purple-500" size={20} />
                                        <h2 className="text-lg font-bold text-white">Social Media Accounts</h2>
                                    </div>
                                    <span className="text-[#71767b]">{showSocialConnect ? '▼' : '▶'}</span>
                                </button>

                                {showSocialConnect && (
                                    <div className="bg-[#16181c] border border-[#333] rounded-xl p-4">
                                        <SocialMediaConnect />
                                    </div>
                                )}
                            </div>

                            <hr className="border-[#333]" />

                            {/* AI Generator Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="text-[#1d9bf0]" size={20} />
                                    <h2 className="text-lg font-bold text-white">AI Magic Generator</h2>
                                </div>

                                <div className="flex gap-3">
                                    <input
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        placeholder="Enter a topic (e.g. 'Monday morning meetings')..."
                                        className="flex-1 bg-[#16181c] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#1d9bf0] outline-none"
                                    />
                                    <button
                                        onClick={handleAiGenerate}
                                        disabled={isAiGenerating || !aiTopic}
                                        className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold px-6 rounded-xl disabled:opacity-50 transition-colors"
                                    >
                                        {isAiGenerating ? "Thinking..." : "Generate Ideas"}
                                    </button>
                                </div>

                                {/* Grid Results */}
                                {generatedMemes.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {generatedMemes.map((meme, i) => {
                                            const tmpl = MEME_TEMPLATES.find(t => t.id === meme.templateId);
                                            if (!tmpl) return null;
                                            return (
                                                <MemeThumbnail
                                                    key={i}
                                                    template={tmpl}
                                                    texts={meme.texts}
                                                    onClick={() => loadGeneratedMeme(meme)}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <hr className="border-[#333]" />

                            {/* Template Library */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#71767b] flex items-center gap-2">
                                    <Grid size={16} /> All Templates
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {MEME_TEMPLATES.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                setSelectedTemplate(t);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }}
                                            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedTemplate.id === t.id ? "border-white scale-105 shadow-xl" : "border-transparent opacity-60 hover:opacity-100"
                                                }`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={t.url} alt={t.name} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </>
                    )}

                    {/* Video Memes Tab */}
                    {activeTab === 'video' && (
                        <>
                            {/* AI Generator Section */}
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="text-purple-500" size={20} />
                                    <h2 className="text-lg font-bold text-white">AI Video Meme Generator</h2>
                                </div>

                                <div className="flex gap-3">
                                    <input
                                        value={videoAiTopic}
                                        onChange={(e) => setVideoAiTopic(e.target.value)}
                                        placeholder="Enter a topic (e.g. 'coding bugs', 'Monday mornings')..."
                                        className="flex-1 bg-[#16181c] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none"
                                    />
                                    <button
                                        onClick={handleVideoAiGenerate}
                                        disabled={isVideoAiGenerating || !videoAiTopic}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 rounded-xl disabled:opacity-50 transition-colors"
                                    >
                                        {isVideoAiGenerating ? "Generating..." : "Generate Ideas"}
                                    </button>
                                </div>

                                {/* Generated Video Memes Grid */}
                                {generatedVideoMemes.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {generatedVideoMemes.map((meme, i) => {
                                            const tmpl = VIDEO_TEMPLATES.find(t => t.id === meme.templateId);
                                            if (!tmpl) return null;
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => loadGeneratedVideoMeme(meme)}
                                                    className="cursor-pointer hover:scale-105 transition-transform bg-[#16181c] border border-[#333] rounded-xl overflow-hidden hover:border-purple-500"
                                                >
                                                    <div className="aspect-video relative">
                                                        <img
                                                            src={tmpl.thumbnailUrl}
                                                            alt={tmpl.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                                                            <div className="text-white text-xs font-bold">
                                                                {meme.textOverlays[0]?.text}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-xs text-[#71767b] truncate">{tmpl.name}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <hr className="border-[#333]" />

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Template & Audio Selection */}
                                <div className="space-y-6">
                                    <VideoTemplateSelector
                                        selectedTemplate={selectedVideoTemplate}
                                        onSelect={setSelectedVideoTemplate}
                                    />

                                    <hr className="border-[#333]" />

                                    <AudioSelector
                                        selectedAudio={selectedAudio}
                                        onSelect={setSelectedAudio}
                                    />
                                </div>

                                {/* Right Column - Video Editor */}
                                <div>
                                    <VideoEditor
                                        template={selectedVideoTemplate}
                                        audio={selectedAudio}
                                        onExport={(blob) => {
                                            downloadVideoBlob(blob, `video-meme-${selectedVideoTemplate.id}-${Date.now()}.webm`);
                                        }}
                                        onShare={(blob) => {
                                            setVideoBlob(blob);
                                            setIsPostingModalOpen(true);
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Bulk Auto Schedule Tab */}
                    {activeTab === 'bulk' && (
                        <div className="animate-in fade-in duration-300">
                            <BulkMemeGenerator />
                        </div>
                    )}

                </div>
            </main>

            {/* Fixed Preview Panel */}
            <PreviewPanel
                canvasRef={activeTab === 'image' ? canvasRef : undefined}
                videoRef={activeTab === 'video' ? videoRef : undefined}
                type={activeTab === 'bulk' ? 'image' : activeTab}
                format={format}
                onDownload={activeTab === 'image' ? handleDownload : handleDownloadVideo}
                onShare={activeTab === 'image' ? handleGenerateVideo : () => setIsPostingModalOpen(true)}
                isGenerating={isGeneratingVideo}
            />


            {/* Posting Modal */}
            <PostingModal
                isOpen={isPostingModalOpen}
                onClose={() => setIsPostingModalOpen(false)}
                videoBlob={videoBlob}
                onDownload={handleDownloadVideo}
            />
        </div>
    );
}
