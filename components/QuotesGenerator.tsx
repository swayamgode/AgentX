"use client";

import { useState } from "react";
import { Sparkles, Download, Share2, RefreshCw } from "lucide-react";

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

    const downloadQuote = (quote: Quote, index: number) => {
        // Create a canvas to render the quote
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d')!;

        // Gradient background
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1080);

        // Quote text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Word wrap
        const words = quote.text.split(' ');
        const lines: string[] = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 900) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);

        // Draw lines
        const lineHeight = 80;
        const startY = 540 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, i) => {
            ctx.fillText(line, 540, startY + i * lineHeight);
        });

        // Author
        ctx.font = '40px Arial';
        ctx.fillText(`- ${quote.author}`, 540, 900);

        // Download
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

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] p-6 rounded-2xl border border-[#333]">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="text-purple-500" />
                    Generate Quotes
                </h2>

                <div className="space-y-4">
                    <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter topic (e.g., 'Success', 'Motivation', 'Life')..."
                        className="w-full bg-[#000] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                    />

                    <div className="flex gap-2">
                        {(['inspirational', 'funny', 'wisdom', 'success'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setStyle(s)}
                                className={`flex-1 py-2 rounded-lg font-bold transition-all ${style === s
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-[#333] text-[#71767b] hover:bg-[#444]'
                                    }`}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="animate-spin" size={20} />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate Quotes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Quotes Grid */}
            {quotes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quotes.map((quote, index) => (
                        <div
                            key={index}
                            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 rounded-2xl border border-purple-500/30 hover:border-purple-500 transition-all group"
                        >
                            <p className="text-white text-lg font-bold mb-4 leading-relaxed">
                                "{quote.text}"
                            </p>
                            <p className="text-[#a1a1aa] text-sm mb-4">- {quote.author}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => downloadQuote(quote, index)}
                                    className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Download size={16} />
                                    Download
                                </button>
                                <button className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                                    <Share2 size={16} />
                                    Share
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
