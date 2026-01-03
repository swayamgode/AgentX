"use client";

import { useState, useRef, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { Download, Image as ImageIcon, Sparkles, Type, RefreshCw } from "lucide-react";

const MEME_TEMPLATES = [
    { id: "drake", name: "Drake Hotline Bling", url: "https://i.imgflip.com/30b1gx.jpg" },
    { id: "distracted", name: "Distracted Boyfriend", url: "https://i.imgflip.com/1ur9b0.jpg" },
    { id: "two-buttons", name: "Two Buttons", url: "https://i.imgflip.com/1g8my4.jpg" },
    { id: "change-mind", name: "Change My Mind", url: "https://i.imgflip.com/24y43o.jpg" },
    { id: "exit-ramp", name: "Left Exit 12 Off Ramp", url: "https://i.imgflip.com/22bdq6.jpg" },
    { id: "batman", name: "Batman Slapping Robin", url: "https://i.imgflip.com/9ehk.jpg" },
];

export default function MemePage() {
    const [selectedTemplate, setSelectedTemplate] = useState(MEME_TEMPLATES[0]);
    const [topText, setTopText] = useState("When the code works");
    const [bottomText, setBottomText] = useState("But I don't know why");
    const [isExporting, setIsExporting] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Draw meme on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = selectedTemplate.url;

        image.onload = () => {
            // Set canvas dimensions to match image
            canvas.width = image.width;
            canvas.height = image.height;

            // Draw image
            ctx.drawImage(image, 0, 0);

            // Configure text style
            const fontSize = Math.floor(canvas.width * 0.1);
            ctx.font = `900 ${fontSize}px sans-serif`;
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black";
            ctx.lineWidth = Math.floor(fontSize * 0.08);
            ctx.textAlign = "center";
            ctx.lineJoin = "round"; // Smoother stroke corners

            // Draw Top Text
            if (topText) {
                ctx.textBaseline = "top";
                const topY = canvas.height * 0.05;
                ctx.strokeText(topText.toUpperCase(), canvas.width / 2, topY);
                ctx.fillText(topText.toUpperCase(), canvas.width / 2, topY);
            }

            // Draw Bottom Text
            if (bottomText) {
                ctx.textBaseline = "bottom";
                const bottomY = canvas.height * 0.95;
                ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, bottomY);
                ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, bottomY);
            }
        };
    }, [selectedTemplate, topText, bottomText]);

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsExporting(true);
        try {
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            const link = document.createElement("a");
            link.download = `meme-${Date.now()}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Download failed", e);
        } finally {
            setIsExporting(false);
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

                    <div className="p-4 space-y-6">

                        {/* Template Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#71767b] flex items-center gap-2">
                                <ImageIcon size={16} /> Choose Template
                            </label>
                            <div className="grid grid-cols-3 gap-2 overflow-x-auto pb-2">
                                {MEME_TEMPLATES.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setSelectedTemplate(t)}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedTemplate.id === t.id ? "border-white scale-105 shadow-xl" : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={t.url} alt={t.name} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Canvas Preview Area */}
                        <div className="bg-[#1a1a1a] rounded-2xl border border-[#333] p-4 flex justify-center items-center min-h-[300px]">
                            <canvas
                                ref={canvasRef}
                                className="max-w-full max-h-[400px] object-contain shadow-2xl rounded-sm"
                            />
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4 bg-[#16181c] p-4 rounded-2xl border border-[#333]">
                            <div>
                                <label className="text-xs font-bold text-[#71767b] mb-1 block">TOP TEXT</label>
                                <input
                                    type="text"
                                    value={topText}
                                    onChange={(e) => setTopText(e.target.value)}
                                    className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                                    placeholder="TOP TEXT"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#71767b] mb-1 block">BOTTOM TEXT</label>
                                <input
                                    type="text"
                                    value={bottomText}
                                    onChange={(e) => setBottomText(e.target.value)}
                                    className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                                    placeholder="BOTTOM TEXT"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setTopText("");
                                    setBottomText("");
                                }}
                                className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} /> Reset
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-[2] bg-white hover:bg-[#e5e5e5] text-black font-bold py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <Download size={18} /> Download Meme
                            </button>
                        </div>

                    </div>
                </main>

                <RightSidebar />
            </div>
        </div>
    );
}
