"use client";

import { useState, useRef, useEffect } from "react";
import { AudioTrack, AUDIO_LIBRARY, getTrendingAudio, getAudioByCategory } from "@/lib/audio-library";
import { Music, Play, Pause, Search, TrendingUp, Volume2, VolumeX } from "lucide-react";

interface AudioSelectorProps {
    onSelect: (audio: AudioTrack | null) => void;
    selectedAudio?: AudioTrack | null;
}

export function AudioSelector({ onSelect, selectedAudio }: AudioSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const categories = [
        { id: "all", label: "All" },
        { id: "trending", label: "Trending", icon: TrendingUp },
        { id: "sound-effect", label: "Sound FX" },
        { id: "comedy", label: "Comedy" },
        { id: "dramatic", label: "Dramatic" },
        { id: "epic", label: "Epic" },
    ];

    const getFilteredAudio = () => {
        let audio = AUDIO_LIBRARY;

        if (selectedCategory === "trending") {
            audio = getTrendingAudio();
        } else if (selectedCategory !== "all") {
            audio = getAudioByCategory(selectedCategory as any);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            audio = audio.filter(
                a =>
                    a.name.toLowerCase().includes(query) ||
                    a.description.toLowerCase().includes(query) ||
                    a.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return audio;
    };

    const filteredAudio = getFilteredAudio();

    const handlePlayPause = (audio: AudioTrack) => {
        if (playingId === audio.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            if (audio.audioUrl) {
                const newAudio = new Audio(audio.audioUrl);
                newAudio.play();
                newAudio.onended = () => setPlayingId(null);
                audioRef.current = newAudio;
                setPlayingId(audio.id);
            }
        }
    };

    useEffect(() => {
        return () => {
            audioRef.current?.pause();
        };
    }, []);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Music className="text-pink-500" size={20} />
                    Audio Tracks
                </h3>
                <span className="text-sm text-[#71767b]">{filteredAudio.length} tracks</span>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71767b]" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search audio..."
                    className="w-full bg-[#000] border border-[#333] rounded-lg pl-10 pr-4 py-2 text-white focus:border-white transition-colors outline-none"
                />
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategory === category.id
                                    ? "bg-white text-black"
                                    : "bg-[#16181c] text-[#71767b] hover:text-white border border-[#333]"
                                }`}
                        >
                            {Icon && <Icon size={16} />}
                            {category.label}
                        </button>
                    );
                })}
            </div>

            {/* Audio List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {/* No Audio Option */}
                <button
                    onClick={() => onSelect(null)}
                    className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedAudio === null
                            ? "border-pink-500 bg-pink-500/10"
                            : "border-[#333] bg-[#16181c] hover:border-[#444]"
                        }`}
                >
                    <div className="w-10 h-10 rounded-lg bg-[#000] flex items-center justify-center">
                        <VolumeX size={20} className="text-[#71767b]" />
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-white font-semibold text-sm">No Audio</p>
                        <p className="text-[#71767b] text-xs">Silent video</p>
                    </div>
                </button>

                {filteredAudio.map((audio) => (
                    <button
                        key={audio.id}
                        onClick={() => onSelect(audio)}
                        className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedAudio?.id === audio.id
                                ? "border-pink-500 bg-pink-500/10"
                                : "border-[#333] bg-[#16181c] hover:border-[#444]"
                            }`}
                    >
                        {/* Play Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePlayPause(audio);
                            }}
                            className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            {playingId === audio.id ? (
                                <Pause size={18} className="text-white" fill="white" />
                            ) : (
                                <Play size={18} className="text-white" fill="white" />
                            )}
                        </button>

                        {/* Info */}
                        <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                                <p className="text-white font-semibold text-sm">{audio.name}</p>
                                {audio.trending && (
                                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-2 py-0.5 flex items-center gap-1">
                                        <TrendingUp size={10} className="text-white" />
                                        <span className="text-white text-[10px] font-bold">HOT</span>
                                    </span>
                                )}
                            </div>
                            <p className="text-[#71767b] text-xs">{audio.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[#71767b] text-xs">{audio.duration}s</span>
                                {audio.artist && (
                                    <>
                                        <span className="text-[#71767b]">•</span>
                                        <span className="text-[#71767b] text-xs">{audio.artist}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Selected Indicator */}
                        {selectedAudio?.id === audio.id && (
                            <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                                <Volume2 size={14} className="text-white" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {filteredAudio.length === 0 && (
                <div className="text-center py-12 text-[#71767b]">
                    <p>No audio tracks found</p>
                    <p className="text-sm mt-1">Try a different search or category</p>
                </div>
            )}
        </div>
    );
}
