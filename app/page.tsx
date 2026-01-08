"use client";

import { useState, useEffect } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { PostingModal } from "@/components/PostingModal";
import { Feed } from "@/components/Feed";
import ApprovalModal from "@/components/ApprovalModal";
import { Image, Smile, Calendar, MapPin, Layers, Globe, Sparkles, Video, Play, Youtube } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"post" | "bulk" | "video">("post");

  // Single Post State
  const [postContent, setPostContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoMode, setVideoMode] = useState<"ai" | "canva">("ai"); // Toggle for Video Tab

  // Bulk State
  const [bulkTopic, setBulkTopic] = useState("");
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

  // Video State
  const [videoTopic, setVideoTopic] = useState("");
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<{ html: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [refreshFeed, setRefreshFeed] = useState(0);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pendingTweets, setPendingTweets] = useState<any[]>([]);

  // AI Generation (Rewrite/Generate for Single Post)
  const handleGenerate = async () => {
    if (!postContent) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: postContent, vibe: "professional" }),
      });
      const data = await response.json();
      if (data.tweet) {
        setPostContent(data.tweet);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePost = async () => {
    if (!postContent) return;
    try {
      await fetch("/api/tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: postContent }),
      });
      setPostContent("");
      setRefreshFeed(prev => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkGenerate = async () => {
    const inputTopic = bulkTopic || "Industry trends";

    setIsBulkGenerating(true);
    try {
      const response = await fetch("/api/generate-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: inputTopic, count: 30 }),
      });
      const data = await response.json();
      if (data.success) {
        setPendingTweets(data.tweets);
        setShowApprovalModal(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const handleVideoGenerate = async () => {
    if (!videoTopic) return;
    setIsVideoGenerating(true);
    setGeneratedVideo(null);
    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: videoTopic, vibe: "trendy" }),
      });
      const data = await response.json();
      if (data.video && data.video.html) {
        setGeneratedVideo({ html: data.video.html });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const handleYouTubeUpload = async () => {
    if (!generatedVideo) return;
    setIsUploading(true);
    // Mock upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert("Successfully posted to YouTube Shorts!");
    setIsUploading(false);
  };

  const handleDownloadHtml = () => {
    if (!generatedVideo) return;
    const blob = new Blob([generatedVideo.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reel-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportVideo = async () => {
    if (!generatedVideo) return;
    setIsExporting(true);
    try {
      const response = await fetch("/api/export-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: generatedVideo.html }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reel-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
      alert("Failed to export video. Please try 'Download HTML' instead.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleApproveTweets = async (tweetIds: string[]) => {
    await fetch("/api/tweets/approve", {
      method: "POST",
      body: JSON.stringify({ tweetIds })
    });
    setRefreshFeed(prev => prev + 1);
    setShowApprovalModal(false);
  };

  const handleRejectTweets = async (tweetIds: string[]) => {
    await fetch("/api/tweets/reject", {
      method: "POST",
      body: JSON.stringify({ tweetIds })
    });
  };

  return (
    <div className="flex justify-center min-h-screen bg-black text-[#e7e9ea]">
      <div className="flex w-full max-w-[1265px]">

        <LeftSidebar />

        <main className="flex-1 max-w-[600px] border-x border-[#333] min-h-screen flex flex-col">
          <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#333] flex">
            <button
              onClick={() => setActiveTab("post")}
              className={`flex-1 p-4 text-center font-bold relative hover:bg-[#1a1a1a] transition-colors ${activeTab === 'post' ? 'text-white' : 'text-[#71767b]'}`}
            >
              Post
              {activeTab === 'post' && <div className="absolute bottom-0 h-1 w-14 bg-white rounded-full left-1/2 -translate-x-1/2"></div>}
            </button>
            <button
              onClick={() => setActiveTab("video")}
              className={`flex-1 p-4 text-center font-bold relative hover:bg-[#1a1a1a] transition-colors ${activeTab === 'video' ? 'text-white' : 'text-[#71767b]'}`}
            >
              Video
              {activeTab === 'video' && <div className="absolute bottom-0 h-1 w-14 bg-white rounded-full left-1/2 -translate-x-1/2"></div>}
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`flex-1 p-4 text-center font-bold relative hover:bg-[#1a1a1a] transition-colors ${activeTab === 'bulk' ? 'text-white' : 'text-[#71767b]'}`}
            >
              Bulk Campaign
              {activeTab === 'bulk' && <div className="absolute bottom-0 h-1 w-24 bg-white rounded-full left-1/2 -translate-x-1/2"></div>}
            </button>
          </div>

          {/* Composer */}
          <div className="p-4 border-b border-[#333] flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-lg bg-[#333]"></div>
            </div>
            <div className="flex-1">
              {activeTab === 'post' ? (
                <>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="What is happening?"
                    className="w-full bg-transparent text-xl placeholder-[#52525b] outline-none resize-none min-h-[50px] mt-2 text-white"
                  />
                  {!postContent && <div className="pb-2 text-white font-bold text-sm flex items-center gap-1"><Globe size={14} /> Everyone can reply</div>}
                </>
              ) : activeTab === 'bulk' ? (
                <div className="space-y-3">
                  <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 flex gap-3 text-[#e7e9ea]">
                    <Sparkles className="text-white flex-shrink-0" size={20} />
                    <div className="text-sm">
                      <p className="font-bold mb-1">AI Campaign Mode</p>
                      <p className="text-[#a1a1aa]">Enter a topic, and AgentX will generate and schedule 30 days of content automatically.</p>
                    </div>
                  </div>
                  <textarea
                    value={bulkTopic}
                    onChange={(e) => setBulkTopic(e.target.value)}
                    placeholder="Enter campaign topic (e.g., 'Future of Fintech')..."
                    className="w-full bg-transparent text-xl placeholder-[#52525b] outline-none resize-none min-h-[50px] text-white"
                  />
                </div>
              ) : (
                // Video Tab Content
                <div className="space-y-3">
                  <div className="flex gap-2 mb-2 p-1 bg-[#1a1a1a] rounded-lg border border-[#333]">
                    <button onClick={() => setVideoMode("ai")} className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${videoMode === "ai" ? "bg-[#333] text-white" : "text-[#71767b] hover:text-white"}`}>AI Generator</button>
                    <button onClick={() => setVideoMode("canva")} className={`flex-1 py-1 text-xs font-bold rounded-md transition-colors ${videoMode === "canva" ? "bg-[#5631eb] text-white" : "text-[#71767b] hover:text-white"}`}>Canva Studio</button>
                  </div>

                  {videoMode === "ai" ? (
                    <>
                      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 flex gap-3 text-[#e7e9ea]">
                        <Video className="text-white flex-shrink-0" size={20} />
                        <div className="text-sm">
                          <p className="font-bold mb-1">AI Video Creator</p>
                          <p className="text-[#a1a1aa]">Generate viral Reel/TikTok concepts with scripts and visual planning.</p>
                        </div>
                      </div>
                      <textarea
                        value={videoTopic}
                        onChange={(e) => setVideoTopic(e.target.value)}
                        placeholder="Video topic (e.g. '3 Tips for Productivity')..."
                        className="w-full bg-transparent text-xl placeholder-[#52525b] outline-none resize-none min-h-[50px] text-white"
                      />
                    </>
                  ) : (
                    <div className="flex flex-col gap-4 items-center justify-center p-8 border border-[#333] border-dashed rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00C4CC] to-[#7D2AE8] flex items-center justify-center mb-2">
                        <span className="font-bold text-xl italic text-white">C</span>
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-lg text-white">Connect to Canva</h3>
                        <p className="text-sm text-[#71767b] mt-1 max-w-xs">Create professional designs using Canva's templates directly from AgentX.</p>
                      </div>
                      <a
                        href="/api/canva/auth"
                        className="bg-[#7D2AE8] hover:bg-[#5631eb] text-white font-bold px-6 py-2 rounded-full transition-all shadow-lg text-sm flex items-center gap-2"
                      >
                        Connect Account
                      </a>
                      <p className="text-[10px] text-[#555] mt-2">Requires Canva Developer Credentials</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center mt-3 border-t border-[#333] pt-3">
              <div className="flex gap-1 text-white">
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Image size={20} /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Layers size={20} /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Smile size={20} /></button>
                <button className="p-2 hover:bg-white/10 rounded-full transition-colors"><Calendar size={20} /></button>

                {/* AI Enhance Button for Single Post */}
                {activeTab === 'post' && (
                  <button
                    onClick={handleGenerate}
                    disabled={!postContent || isGenerating}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors group relative"
                    title="Enhance with AI"
                  >
                    <Sparkles size={20} className={isGenerating ? "animate-pulse" : ""} />
                    {isGenerating && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded border border-[#333]">Generating...</span>}
                  </button>
                )}
              </div>

              {activeTab === 'post' ? (
                <button
                  onClick={handlePost}
                  disabled={!postContent}
                  className="bg-white hover:bg-[#e5e5e5] text-black font-bold px-5 py-1.5 rounded-xl disabled:opacity-50 transition-colors"
                >
                  Post
                </button>
              ) : activeTab === 'bulk' ? (
                <button
                  onClick={handleBulkGenerate}
                  disabled={isBulkGenerating || !bulkTopic}
                  className="bg-white text-black hover:bg-[#e5e5e5] font-bold px-5 py-1.5 rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isBulkGenerating ? "Generating..." : <><Layers size={16} /><span>Launch Campaign</span></>}
                </button>
              ) : (
                <button
                  onClick={handleVideoGenerate}
                  disabled={isVideoGenerating || !videoTopic}
                  className="bg-white text-black hover:bg-[#e5e5e5] font-bold px-5 py-1.5 rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isVideoGenerating ? "Creating..." : <><Video size={16} /><span>Generate Reel</span></>}
                </button>
              )}
            </div>
          </div>





          {
            activeTab === 'video' && generatedVideo && (
              <div className="p-4 border-b border-[#333] flex justify-center bg-[#0a0a0a]">
                <div className="flex flex-col gap-4 items-center">

                  <div className="relative w-[280px] aspect-[9/16] bg-[#1a1a1a] rounded-[2rem] border-4 border-[#333] overflow-hidden shadow-2xl flex flex-col group">
                    {/* Top Overlay */}
                    <div className="absolute top-4 left-0 right-0 z-30 flex justify-between px-4 text-white drop-shadow-md mix-blend-difference pointer-events-none">
                      <span className="text-xs font-bold">Reels</span>
                      <span className="text-xs">Camera</span>
                    </div>

                    {/* Rendered HTML Content - HD SCALED */}
                    <div className="absolute top-0 left-0 w-[1080px] h-[1920px] bg-black origin-top-left scale-[0.25925] z-10 pointer-events-none select-none">
                      <div
                        className="w-full h-full overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: generatedVideo.html }}
                      />
                    </div>

                    {/* Side Actions (Static) */}
                    <div className="absolute right-2 bottom-20 flex flex-col gap-4 items-center z-30 mix-blend-difference pointer-events-none scale-90 origin-bottom-right">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Smile size={16} className="text-white" /></div>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Layers size={16} className="text-white" /></div>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><Globe size={16} className="text-white" /></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 w-full max-w-[280px]">
                    <button
                      onClick={handleYouTubeUpload}
                      disabled={isUploading}
                      className="flex items-center justify-center gap-2 bg-[#FF0000] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#cc0000] transition-colors shadow-lg disabled:opacity-50 text-sm"
                    >
                      {isUploading ? "Uploading..." : <><Youtube size={18} /> Post to YouTube</>}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadHtml}
                        className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 rounded-xl font-bold text-sm transition-colors border border-white/10"
                      >
                        Download HTML
                      </button>
                      <button
                        onClick={handleExportVideo}
                        disabled={isExporting} // Ensure state is defined
                        className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 rounded-xl font-bold text-sm transition-colors border border-white/10 flex items-center justify-center gap-2"
                      >
                        {isExporting ? "Exporting..." : <><Video size={14} /> Export Video</>}
                      </button>
                    </div>
                    <p className="text-[10px] text-[#71767b] text-center">To record MP4: Click 'Record', select this Tab, and stop when done.</p>
                  </div>

                </div>
              </div>
            )
          }

          {activeTab !== 'video' && <Feed refreshTrigger={refreshFeed} />}

        </main >

      </div >

      {showApprovalModal && (
        <ApprovalModal
          tweets={pendingTweets}
          onClose={() => setShowApprovalModal(false)}
          onApprove={handleApproveTweets}
          onReject={handleRejectTweets}
        />
      )
      }
    </div >
  );
}
