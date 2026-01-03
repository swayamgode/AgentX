"use client";

import { useState, useRef, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { Download, Image as ImageIcon, Sparkles, RefreshCw, Grid } from "lucide-react";
import { MEME_TEMPLATES, MemeTemplate } from "@/lib/memes";

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

            // Rendering Logic (Simplified for thumbnail - no scaling logic needed as much)
            const scale = canvas.width / template.width;

            template.textData.forEach((textConfig, i) => {
                const content = texts[i] || "";
                if (!content) return;

                const fontSize = textConfig.fontSize * scale;
                const isImpact = textConfig.style === "impact";

                ctx.font = isImpact
                    ? `900 ${fontSize}px Impact, Anton, sans-serif`
                    : `700 ${fontSize}px Arial, sans-serif`;
                ctx.fillStyle = textConfig.color;
                ctx.strokeStyle = textConfig.stroke;
                ctx.lineWidth = isImpact ? 3 : 2; // Thinner for thumbnails
                ctx.textAlign = "center";
                ctx.lineJoin = "round";

                const x = canvas.width * (textConfig.x / 100);
                const y = canvas.height * (textConfig.y / 100);

                ctx.save();
                ctx.translate(x, y);
                if (textConfig.rotation) ctx.rotate((textConfig.rotation * Math.PI) / 180);

                const textToDraw = textConfig.allCaps !== false ? content.toUpperCase() : content;
                ctx.textBaseline = textConfig.anchor === "middle" ? "middle" : textConfig.anchor === "bottom" ? "bottom" : "top";

                if (textConfig.stroke !== "transparent") {
                    ctx.strokeText(textToDraw, 0, 0);
                }
                ctx.fillText(textToDraw, 0, 0);
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

    // AI State
    const [aiTopic, setAiTopic] = useState("");
    const [isAiGenerating, setIsAiGenerating] = useState(false);
    const [generatedMemes, setGeneratedMemes] = useState<{ templateId: string; texts: string[] }[]>([]);

    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Update text inputs when template changes
    useEffect(() => {
        // Preserve existing texts if they fit, otherwise slice or fill
        setTextInputs(prev => {
            const newLength = selectedTemplate.boxCount;
            if (prev.length >= newLength) return prev.slice(0, newLength);
            return [...prev, ...Array(newLength - prev.length).fill("")];
        });
    }, [selectedTemplate]);

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
            canvas.width = selectedTemplate.width;
            canvas.height = selectedTemplate.height;

            ctx.drawImage(image, 0, 0);

            selectedTemplate.textData.forEach((textConfig, i) => {
                const content = textInputs[i] || "";

                // Render placeholder box if empty? No, just render nothing
                if (!content) return;

                ctx.save();

                // Font Settings - Different styles for impact vs label
                const fontSize = textConfig.fontSize;
                const isImpact = textConfig.style === "impact";

                // Impact uses Anton/Impact font, labels use Arial
                ctx.font = isImpact
                    ? `900 ${fontSize}px Impact, Anton, sans-serif`
                    : `700 ${fontSize}px Arial, sans-serif`;

                ctx.fillStyle = textConfig.color;
                ctx.strokeStyle = textConfig.stroke;

                // Impact text has thicker stroke
                ctx.lineWidth = isImpact ? Math.floor(fontSize * 0.1) : Math.floor(fontSize * 0.05);
                ctx.textAlign = "center";
                ctx.lineJoin = "round";

                // Position
                const x = canvas.width * (textConfig.x / 100);
                const y = canvas.height * (textConfig.y / 100);

                ctx.translate(x, y);

                // Rotation
                if (textConfig.rotation) {
                    ctx.rotate((textConfig.rotation * Math.PI) / 180);
                }

                // Text Wrap Logic would go here (complex), 
                // For now, simple scaling if too wide

                const textToDraw = textConfig.allCaps !== false ? content.toUpperCase() : content;
                ctx.textBaseline = textConfig.anchor === "middle" ? "middle" : textConfig.anchor === "bottom" ? "bottom" : "top";

                // Only stroke if stroke color is not transparent
                if (textConfig.stroke !== "transparent") {
                    ctx.strokeText(textToDraw, 0, 0);
                }
                ctx.fillText(textToDraw, 0, 0);

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
            link.download = `meme-${selectedTemplate.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error(e);
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

    return (
        <div className="flex justify-center min-h-screen bg-black text-[#e7e9ea]">
            <div className="flex w-full max-w-[1265px]">
                <LeftSidebar />

                <main className="flex-1 max-w-[600px] border-x border-[#333] min-h-screen flex flex-col">
                    {/* Header */}
                    <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#333] p-4">
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="text-purple-500" /> Meme Studio
                        </h1>
                    </div>

                    <div className="p-4 space-y-8 pb-32">

                        {/* Editor Section */}
                        <div className="space-y-6">

                            {/* Canvas */}
                            <div className="bg-[#1a1a1a] rounded-2xl border border-[#333] p-4 flex justify-center items-center min-h-[300px]">
                                <canvas
                                    ref={canvasRef}
                                    className="max-w-full max-h-[500px] object-contain shadow-2xl rounded-sm"
                                />
                            </div>

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
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTextInputs(Array(selectedTemplate.boxCount).fill(""))}
                                    className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw size={18} /> Reset
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex-[2] bg-white hover:bg-[#e5e5e5] text-black font-bold py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Download size={18} /> Download
                                </button>
                            </div>
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

                    </div>
                </main>

                <RightSidebar />
            </div>
        </div>
    );
}
