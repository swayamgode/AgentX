"use client";

import { useState } from "react";
import { X, Youtube, Instagram, Loader2, CheckCircle, AlertCircle, Download } from "lucide-react";

interface PostingModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoBlob: Blob | null;
    onDownload: () => void;
}

export function PostingModal({ isOpen, onClose, videoBlob, onDownload }: PostingModalProps) {
    const [selectedPlatforms, setSelectedPlatforms] = useState<('youtube' | 'instagram')[]>([]);
    const [caption, setCaption] = useState("");
    const [tags, setTags] = useState("meme,funny,shorts");
    const [privacy, setPrivacy] = useState("public");
    const [isPosting, setIsPosting] = useState(false);
    const [postStatus, setPostStatus] = useState<{
        youtube?: { success: boolean; message: string; url?: string };
        instagram?: { success: boolean; message: string; url?: string };
    }>({});

    if (!isOpen) return null;

    const togglePlatform = (platform: 'youtube' | 'instagram') => {
        setSelectedPlatforms(prev =>
            prev.includes(platform)
                ? prev.filter(p => p !== platform)
                : [...prev, platform]
        );
    };

    const handlePost = async () => {
        if (!videoBlob || selectedPlatforms.length === 0) return;

        setIsPosting(true);
        setPostStatus({});

        for (const platform of selectedPlatforms) {
            try {
                const formData = new FormData();
                formData.append('video', videoBlob, 'meme-reel.webm');

                if (platform === 'youtube') {
                    formData.append('title', caption || 'Meme Reel');
                    formData.append('description', caption || 'Created with AgentX Meme Studio');
                    formData.append('tags', tags);
                    formData.append('privacy', privacy);
                } else {
                    formData.append('caption', caption || 'Created with AgentX Meme Studio 🎬');
                    formData.append('shareToFeed', 'true');
                }

                const response = await fetch(`/api/${platform}/upload`, {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                setPostStatus(prev => ({
                    ...prev,
                    [platform]: {
                        success: data.success || false,
                        message: data.message || data.error || 'Unknown error',
                        url: data.videoUrl || data.mediaUrl,
                    },
                }));
            } catch (error: any) {
                setPostStatus(prev => ({
                    ...prev,
                    [platform]: {
                        success: false,
                        message: error.message || 'Failed to post',
                    },
                }));
            }
        }

        setIsPosting(false);
    };

    const allPostsComplete = Object.keys(postStatus).length === selectedPlatforms.length;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#333] p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Post Meme Reel</h2>
                    <button
                        onClick={onClose}
                        className="text-[#71767b] hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Platform Selection */}
                    <div>
                        <label className="text-sm font-bold text-[#71767b] mb-3 block">
                            SELECT PLATFORMS
                        </label>
                        <div className="space-y-2">
                            <button
                                onClick={() => togglePlatform('youtube')}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedPlatforms.includes('youtube')
                                        ? 'border-red-500 bg-red-500/10'
                                        : 'border-[#333] hover:border-[#444]'
                                    }`}
                            >
                                <Youtube className="text-red-500" size={24} />
                                <span className="font-semibold text-white">YouTube Shorts</span>
                                {selectedPlatforms.includes('youtube') && (
                                    <CheckCircle className="ml-auto text-red-500" size={20} />
                                )}
                            </button>

                            <button
                                onClick={() => togglePlatform('instagram')}
                                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedPlatforms.includes('instagram')
                                        ? 'border-pink-500 bg-pink-500/10'
                                        : 'border-[#333] hover:border-[#444]'
                                    }`}
                            >
                                <Instagram className="text-pink-500" size={24} />
                                <span className="font-semibold text-white">Instagram Reels</span>
                                {selectedPlatforms.includes('instagram') && (
                                    <CheckCircle className="ml-auto text-pink-500" size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="text-sm font-bold text-[#71767b] mb-2 block">
                            CAPTION / DESCRIPTION
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Add a catchy caption for your meme reel..."
                            className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none resize-none"
                            rows={3}
                        />
                    </div>

                    {/* YouTube-specific options */}
                    {selectedPlatforms.includes('youtube') && (
                        <>
                            <div>
                                <label className="text-sm font-bold text-[#71767b] mb-2 block">
                                    TAGS (YouTube)
                                </label>
                                <input
                                    type="text"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="meme,funny,shorts"
                                    className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                                />
                                <p className="text-xs text-[#71767b] mt-1">Separate tags with commas</p>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-[#71767b] mb-2 block">
                                    PRIVACY
                                </label>
                                <select
                                    value={privacy}
                                    onChange={(e) => setPrivacy(e.target.value)}
                                    className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                                >
                                    <option value="public">Public</option>
                                    <option value="unlisted">Unlisted</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Post Status */}
                    {Object.keys(postStatus).length > 0 && (
                        <div className="space-y-2">
                            {Object.entries(postStatus).map(([platform, status]) => (
                                <div
                                    key={platform}
                                    className={`p-3 rounded-lg border ${status.success
                                            ? 'bg-green-500/10 border-green-500'
                                            : 'bg-red-500/10 border-red-500'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {status.success ? (
                                            <CheckCircle className="text-green-500 mt-0.5" size={18} />
                                        ) : (
                                            <AlertCircle className="text-red-500 mt-0.5" size={18} />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-semibold text-white capitalize">{platform}</p>
                                            <p className="text-sm text-[#e7e9ea]">{status.message}</p>
                                            {status.url && (
                                                <a
                                                    href={status.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-400 hover:underline mt-1 inline-block"
                                                >
                                                    View Post →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onDownload}
                            className="flex-1 bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Download
                        </button>
                        <button
                            onClick={handlePost}
                            disabled={isPosting || selectedPlatforms.length === 0 || allPostsComplete}
                            className="flex-[2] bg-white hover:bg-[#e5e5e5] text-black font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isPosting ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Posting...
                                </>
                            ) : allPostsComplete ? (
                                'Posted!'
                            ) : (
                                'Post Now'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
