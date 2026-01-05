"use client";

import { useState } from "react";
import { VideoTemplate, VIDEO_TEMPLATES, getTrendingTemplates, getTemplatesByCategory } from "@/lib/video-templates";
import { Play, Search, TrendingUp, Grid3x3 } from "lucide-react";

interface VideoTemplateSelectorProps {
    onSelect: (template: VideoTemplate) => void;
    selectedTemplate?: VideoTemplate;
}

export function VideoTemplateSelector({ onSelect, selectedTemplate }: VideoTemplateSelectorProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const categories = [
        { id: "all", label: "All", icon: Grid3x3 },
        { id: "trending", label: "Trending", icon: TrendingUp },
        { id: "reaction", label: "Reactions" },
        { id: "typing", label: "Typing" },
        { id: "pointing", label: "Pointing" },
        { id: "dancing", label: "Dancing" },
    ];

    const getFilteredTemplates = () => {
        let templates = VIDEO_TEMPLATES;

        if (selectedCategory === "trending") {
            templates = getTrendingTemplates();
        } else if (selectedCategory !== "all") {
            templates = getTemplatesByCategory(selectedCategory as any);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            templates = templates.filter(
                t =>
                    t.name.toLowerCase().includes(query) ||
                    t.description.toLowerCase().includes(query) ||
                    t.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return templates;
    };

    const filteredTemplates = getFilteredTemplates();

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Play className="text-purple-500" size={20} />
                    Video Templates
                </h3>
                <span className="text-sm text-[#71767b]">{filteredTemplates.length} templates</span>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71767b]" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
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

            {/* Templates Grid */}
            <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {filteredTemplates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className={`relative group rounded-xl overflow-hidden border-2 transition-all ${selectedTemplate?.id === template.id
                                ? "border-purple-500 scale-105"
                                : "border-transparent hover:border-[#444]"
                            }`}
                    >
                        {/* Thumbnail */}
                        <div className="aspect-video bg-[#1a1a1a] relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={template.thumbnailUrl}
                                alt={template.name}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <p className="text-white text-sm font-semibold">{template.name}</p>
                                    <p className="text-[#71767b] text-xs">{template.duration}s</p>
                                </div>
                            </div>

                            {/* Play Icon */}
                            <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
                                <Play size={16} className="text-white" fill="white" />
                            </div>

                            {/* Trending Badge */}
                            {template.trending && (
                                <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full px-2 py-0.5 flex items-center gap-1">
                                    <TrendingUp size={12} className="text-white" />
                                    <span className="text-white text-xs font-bold">Trending</span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="p-2 bg-[#16181c]">
                            <p className="text-white text-sm font-semibold truncate">{template.name}</p>
                            <p className="text-[#71767b] text-xs truncate">{template.description}</p>
                        </div>

                        {/* Selected Indicator */}
                        {selectedTemplate?.id === template.id && (
                            <div className="absolute inset-0 border-4 border-purple-500 rounded-xl pointer-events-none" />
                        )}
                    </button>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-[#71767b]">
                    <p>No templates found</p>
                    <p className="text-sm mt-1">Try a different search or category</p>
                </div>
            )}
        </div>
    );
}
