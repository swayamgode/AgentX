"use client";

import { useState, useRef, useEffect } from "react";
import { VideoTemplate, VideoTextOverlay } from "@/lib/video-templates";
import { AudioTrack } from "@/lib/audio-library";
import { loadVideo, createVideoWithOverlays } from "@/lib/video-editor";
import { Play, Pause, Type, Download, Share2, Loader2 } from "lucide-react";

interface VideoEditorProps {
    template: VideoTemplate;
    audio: AudioTrack | null;
    onExport: (blob: Blob) => void;
    onShare: (blob: Blob) => void;
}

export function VideoEditor({ template, audio, onExport, onShare }: VideoEditorProps) {
    const [textOverlays, setTextOverlays] = useState<VideoTextOverlay[]>(template.textOverlays);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Reset text overlays when template changes
        setTextOverlays(template.textOverlays);
    }, [template.id]);

    useEffect(() => {
        // Load video
        if (videoRef.current) {
            videoRef.current.src = template.videoUrl;
            videoRef.current.load();
        }
    }, [template.videoUrl]);

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTextChange = (index: number, newText: string) => {
        const updated = [...textOverlays];
        updated[index] = { ...updated[index], text: newText };
        setTextOverlays(updated);
    };

    const handleExport = async () => {
        if (!videoRef.current) return;

        setIsProcessing(true);
        try {
            const blob = await createVideoWithOverlays(videoRef.current, {
                template,
                textOverlays,
                audioTrack: audio || undefined,
            });
            onExport(blob);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export video. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleShare = async () => {
        if (!videoRef.current) return;

        setIsProcessing(true);
        try {
            const blob = await createVideoWithOverlays(videoRef.current, {
                template,
                textOverlays,
                audioTrack: audio || undefined,
            });
            onShare(blob);
        } catch (error) {
            console.error('Share failed:', error);
            alert('Failed to generate video. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Video Preview */}
            <div className="bg-[#1a1a1a] rounded-2xl border border-[#333] p-4">
                <div className="relative aspect-[9/16] max-h-[600px] mx-auto bg-black rounded-lg overflow-hidden">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        loop
                        muted={!audio}
                        onEnded={() => setIsPlaying(false)}
                    />

                    {/* Text Overlays Preview */}
                    <div className="absolute inset-0 pointer-events-none">
                        {textOverlays.map((overlay, index) => (
                            <div
                                key={overlay.id}
                                className="absolute"
                                style={{
                                    left: `${overlay.x}%`,
                                    top: `${overlay.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <div
                                    className="px-4 py-2 rounded-lg font-bold text-center"
                                    style={{
                                        fontSize: `${overlay.fontSize * 0.5}px`,
                                        color: overlay.color,
                                        backgroundColor: overlay.backgroundColor || 'transparent',
                                    }}
                                >
                                    {overlay.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Play/Pause Overlay */}
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <button
                                onClick={handlePlayPause}
                                className="w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all hover:scale-110"
                            >
                                <Play size={32} className="text-black ml-1" fill="black" />
                            </button>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                        <button
                            onClick={handlePlayPause}
                            className="w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all"
                        >
                            {isPlaying ? (
                                <Pause size={18} className="text-black" fill="black" />
                            ) : (
                                <Play size={18} className="text-black ml-0.5" fill="black" />
                            )}
                        </button>

                        {audio && (
                            <div className="flex-1 bg-black/60 rounded-lg px-3 py-2">
                                <p className="text-white text-xs font-semibold truncate">🎵 {audio.name}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Text Editor */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Type className="text-purple-500" size={20} />
                    <h3 className="text-lg font-bold text-white">Edit Text</h3>
                </div>

                {textOverlays.map((overlay, index) => (
                    <div key={overlay.id} className="bg-[#16181c] border border-[#333] rounded-xl p-4">
                        <label className="text-xs font-bold text-[#71767b] mb-2 block uppercase">
                            Text {index + 1} ({overlay.position})
                        </label>
                        <input
                            type="text"
                            value={overlay.text}
                            onChange={(e) => handleTextChange(index, e.target.value)}
                            className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                            placeholder={`Enter text for ${overlay.position}...`}
                        />
                        <div className="mt-2 flex items-center gap-4 text-xs text-[#71767b]">
                            <span>⏱️ {overlay.startTime}s - {overlay.endTime}s</span>
                            {overlay.animation !== 'none' && (
                                <span>✨ {overlay.animation}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleExport}
                    disabled={isProcessing}
                    className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Download size={18} />
                            Download
                        </>
                    )}
                </button>
                <button
                    onClick={handleShare}
                    disabled={isProcessing}
                    className="flex-[2] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Share2 size={18} />
                            Share to Social Media
                        </>
                    )}
                </button>
            </div>

            {/* Hidden canvas for rendering */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
