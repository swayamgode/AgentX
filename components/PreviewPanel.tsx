"use client";

import { useRef, useEffect } from "react";
import { Download, Share2, Calendar, Play, Pause } from "lucide-react";

interface PreviewPanelProps {
    canvasRef?: React.RefObject<HTMLCanvasElement | null>;
    videoRef?: React.RefObject<HTMLVideoElement | null>;
    type: 'image' | 'video';
    format: 'square' | 'reels';
    onDownload: () => void;
    onShare: () => void;
    onSchedule?: () => void;
    isGenerating?: boolean;
}

export function PreviewPanel({
    canvasRef,
    videoRef,
    type,
    format,
    onDownload,
    onShare,
    onSchedule,
    isGenerating = false
}: PreviewPanelProps) {
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    // Sync canvas preview
    useEffect(() => {
        if (type === 'image' && canvasRef?.current && previewCanvasRef.current) {
            const sourceCanvas = canvasRef.current;
            const previewCanvas = previewCanvasRef.current;
            const ctx = previewCanvas.getContext('2d');

            if (ctx) {
                // Set preview canvas size
                previewCanvas.width = sourceCanvas.width;
                previewCanvas.height = sourceCanvas.height;

                // Copy content
                ctx.drawImage(sourceCanvas, 0, 0);
            }
        }
    }, [canvasRef, type]);

    return (
        <div className="w-[400px] sticky top-0 h-screen flex flex-col bg-[#0a0a0a] border-l border-[#333] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[#333]">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">Preview</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-[#333] rounded-md text-[#71767b] uppercase font-bold">
                            {format}
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md uppercase font-bold">
                            {type}
                        </span>
                    </div>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
                {type === 'image' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <canvas
                            ref={previewCanvasRef}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                        {isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                                <div className="text-white text-sm font-bold">Generating...</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                        {videoRef?.current && (
                            <video
                                ref={videoRef}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                                controls
                                loop
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-t border-[#333] space-y-2">
                <button
                    onClick={onDownload}
                    disabled={isGenerating}
                    className="w-full bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#444] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Download size={18} />
                    Download {type === 'image' ? 'Image' : 'Video'}
                </button>

                <button
                    onClick={onShare}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Share2 size={18} />
                    Share to Social Media
                </button>

                {onSchedule && (
                    <button
                        onClick={onSchedule}
                        disabled={isGenerating}
                        className="w-full bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#444] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Calendar size={18} />
                        Schedule Post
                    </button>
                )}
            </div>
        </div>
    );
}
