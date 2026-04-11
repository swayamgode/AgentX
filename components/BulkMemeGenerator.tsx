"use client";

import { useState } from "react";
import { Sparkles, Loader2, Calendar, Video, CheckCircle, AlertCircle } from "lucide-react";
import { calculateSchedule, formatSchedule } from "@/lib/scheduler";

interface GeneratedMeme {
    templateId: string;
    audioId: string | null;
    textOverlays: { id: string; text: string }[];
    title: string;
    description: string;
    tags: string[];
}

export function BulkMemeGenerator() {
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(10);
    const [includeAudio, setIncludeAudio] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [generatedMemes, setGeneratedMemes] = useState<GeneratedMeme[]>([]);
    const [schedule, setSchedule] = useState<Date[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Scheduling options
    const [postsPerDay, setPostsPerDay] = useState(6);
    const [startDate, setStartDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow.toISOString().slice(0, 16);
    });

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError("Please enter a topic");
            return;
        }

        setIsGenerating(true);
        setError("");
        setSuccess("");
        setGeneratedMemes([]);
        setSchedule([]);

        try {
            const response = await fetch('/api/memes/generate-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    count,
                    includeAudio,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Generation failed');
            }

            setGeneratedMemes(data.memes);

            // Calculate schedule
            const scheduleStart = new Date(startDate);
            const calculatedSchedule = calculateSchedule({
                startDate: scheduleStart,
                count: data.memes.length,
                postsPerDay,
                startHour: 9,
                endHour: 21,
            });
            setSchedule(calculatedSchedule);

            setSuccess(`Generated ${data.memes.length} memes successfully!`);
        } catch (err: any) {
            setError(err.message || 'Failed to generate memes');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSchedule = async () => {
        if (generatedMemes.length === 0) {
            setError("No memes to schedule");
            return;
        }

        setIsScheduling(true);
        setError("");

        try {
            // Step 1: Generate videos for each meme
            setSuccess(`Generating ${generatedMemes.length} videos...`);

            const videosWithBlobs: any[] = [];
            const CONCURRENCY_LIMIT = 5;
            let currentIdx = 0;

            const processNextVideo = async (): Promise<void> => {
                if (currentIdx >= generatedMemes.length) return;
                
                const i = currentIdx++;
                const meme = generatedMemes[i];

                try {
                    // Generate video from meme config
                    const videoBlob = await generateVideoFromMemeConfig(meme);
                    videosWithBlobs.push({
                        meme,
                        blob: videoBlob,
                        scheduledFor: schedule[i],
                    });
                    setSuccess(`Generated ${videosWithBlobs.length}/${generatedMemes.length} videos...`);
                } catch (err) {
                    console.error(`Failed to generate video ${i}:`, err);
                }
                
                return processNextVideo();
            };

            const workers = Array(Math.min(CONCURRENCY_LIMIT, generatedMemes.length))
                .fill(null)
                .map(() => processNextVideo());
            
            await Promise.all(workers);

            // Step 2: Upload to YouTube
            setSuccess(`Uploading ${videosWithBlobs.length} videos to YouTube...`);

            const uploadedVideos: string[] = [];
            let successCount = 0;
            let failCount = 0;
            let uploadIdx = 0;

            const processNextUpload = async (): Promise<void> => {
                if (uploadIdx >= videosWithBlobs.length) return;

                const item = videosWithBlobs[uploadIdx++];
                const formData = new FormData();
                formData.append('video', item.blob, `meme-${Date.now()}.webm`);
                formData.append('title', item.meme.title);
                formData.append('description', item.meme.description);
                formData.append('tags', JSON.stringify(item.meme.tags));

                try {
                    const response = await fetch('/api/youtube/upload-video', {
                        method: 'POST',
                        body: formData,
                    });

                    if (response.ok) {
                        const data = await response.json();
                        successCount++;
                        uploadedVideos.push(data.videoUrl);
                        setSuccess(`Uploaded ${successCount}/${videosWithBlobs.length} videos...`);
                    } else {
                        failCount++;
                        console.error('Upload failed for video', await response.text());
                    }
                } catch (e) {
                    failCount++;
                    console.error('Upload network error', e);
                }

                return processNextUpload();
            };

            const UPLOAD_CONCURRENCY = 3;
            const uploadWorkers = Array(Math.min(UPLOAD_CONCURRENCY, videosWithBlobs.length))
                .fill(null)
                .map(() => processNextUpload());

            await Promise.all(uploadWorkers);

            setSuccess(`✅ Batch complete! ${successCount} uploaded, ${failCount} failed.`);
            setGeneratedMemes([]);
            setSchedule([]);

            if (uploadedVideos.length > 0) {
                console.log('Uploaded videos:', uploadedVideos);
            }

        } catch (err: any) {
            setError(err.message || 'Failed to upload videos');
        } finally {
            setIsScheduling(false);
        }
    };

    // Helper function to generate video from meme config
    const generateVideoFromMemeConfig = async (meme: GeneratedMeme): Promise<Blob> => {
        // Import video generation utilities
        const { createVideoWithOverlays, loadVideo } = await import('@/lib/video-editor');
        const { VIDEO_TEMPLATES } = await import('@/lib/video-templates');
        const { AUDIO_LIBRARY } = await import('@/lib/audio-library');

        // Get template and audio
        const template = VIDEO_TEMPLATES.find(t => t.id === meme.templateId);
        const audio = meme.audioId ? AUDIO_LIBRARY.find(a => a.id === meme.audioId) : null;

        if (!template) {
            throw new Error(`Template ${meme.templateId} not found`);
        }

        // Load video element
        const videoElement = await loadVideo(template.videoUrl);

        // Map text overlays
        const textOverlays = template.textOverlays.map((overlay, index) => {
            const memeText = meme.textOverlays[index];
            return {
                ...overlay,
                text: memeText?.text || overlay.text,
            };
        });

        // Generate video
        const videoBlob = await createVideoWithOverlays(videoElement, {
            template,
            textOverlays,
            audioTrack: audio || undefined,
        });

        return videoBlob;
    };

    const formattedSchedule = schedule.length > 0 ? formatSchedule(schedule) : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Sparkles className="text-purple-500" size={24} />
                <h2 className="text-2xl font-bold text-white">Bulk Meme Generator</h2>
            </div>

            {/* Generation Form */}
            <div className="bg-[#16181c] border border-[#333] rounded-xl p-6 space-y-4">
                <div>
                    <label className="text-sm font-bold text-[#71767b] mb-2 block">TOPIC / THEME</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., 'Monday mornings', 'Coding bugs', 'Working from home'..."
                        className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-bold text-[#71767b] mb-2 block">QUANTITY</label>
                        <select
                            value={count}
                            onChange={(e) => setCount(Number(e.target.value))}
                            className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                        >
                            <option value={5}>5 memes</option>
                            <option value={10}>10 memes</option>
                            <option value={25}>25 memes</option>
                            <option value={50}>50 memes</option>
                            <option value={100}>100 memes</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-[#71767b] mb-2 block">POSTS PER DAY</label>
                        <select
                            value={postsPerDay}
                            onChange={(e) => setPostsPerDay(Number(e.target.value))}
                            className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                        >
                            <option value={3}>3 per day</option>
                            <option value={6}>6 per day (recommended)</option>
                            <option value={12}>12 per day</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-bold text-[#71767b] mb-2 block">START DATE & TIME</label>
                    <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[#000] border border-[#333] rounded-lg p-3 text-white focus:border-white transition-colors outline-none"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="includeAudio"
                        checked={includeAudio}
                        onChange={(e) => setIncludeAudio(e.target.checked)}
                        className="w-4 h-4"
                    />
                    <label htmlFor="includeAudio" className="text-white text-sm">
                        Include trending audio tracks
                    </label>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !topic.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Generating {count} memes...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate {count} Memes
                        </>
                    )}
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 flex items-start gap-2">
                    <AlertCircle className="text-red-500 mt-0.5" size={18} />
                    <p className="text-red-500 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="bg-green-500/10 border border-green-500 rounded-xl p-4 flex items-start gap-2">
                    <CheckCircle className="text-green-500 mt-0.5" size={18} />
                    <p className="text-green-500 text-sm">{success}</p>
                </div>
            )}

            {/* Generated Memes Preview */}
            {generatedMemes.length > 0 && (
                <div className="bg-[#16181c] border border-[#333] rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Video className="text-purple-500" size={20} />
                            <h3 className="text-lg font-bold text-white">Generated Memes ({generatedMemes.length})</h3>
                        </div>
                        <button
                            onClick={handleSchedule}
                            disabled={isScheduling}
                            className="bg-white hover:bg-[#e5e5e5] text-black font-bold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isScheduling ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Calendar size={16} />
                                    Upload to YouTube
                                </>
                            )}
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                        {generatedMemes.map((meme, index) => (
                            <div
                                key={index}
                                className="bg-[#000] border border-[#333] rounded-lg p-3 flex items-start gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-semibold text-sm truncate">{meme.title}</p>
                                    <p className="text-[#71767b] text-xs truncate">{meme.description}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[#71767b] text-xs">📅 {formattedSchedule[index]?.date}</span>
                                        <span className="text-[#71767b]">•</span>
                                        <span className="text-[#71767b] text-xs">🕐 {formattedSchedule[index]?.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
