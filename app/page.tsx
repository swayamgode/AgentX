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
    <div className="flex justify-center min-h-screen bg-black text-[#e7e9ea] font-sans selection:bg-[#7D2AE8] selection:text-white">
      <div className="flex w-full max-w-[1265px]">

        <LeftSidebar />

        <main className="flex-1 max-w-[600px] border-x border-[#2f3336] min-h-screen flex flex-col relative">

          {/* Glassy Header with Modern Tabs */}
          <div className="sticky top-0 bg-black/60 backdrop-blur-xl z-20 border-b border-[#2f3336]">
            <div className="flex px-4 pt-4 pb-0">
              <button
                onClick={() => setActiveTab("post")}
                className={`flex-1 pb-4 text-center font-bold text-sm transition-all relative ${activeTab === 'post' ? 'text-white' : 'text-[#71767b] hover:text-[#e7e9ea]'}`}
              >
                Post
                {activeTab === 'post' && (
                  <div className="absolute bottom-0 h-[4px] w-14 bg-[#1d9bf0] rounded-full left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(29,155,240,0.5)]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("bulk")}
                className={`flex-1 pb-4 text-center font-bold text-sm transition-all relative ${activeTab === 'bulk' ? 'text-white' : 'text-[#71767b] hover:text-[#e7e9ea]'}`}
              >
                Bulk Campaign
                {activeTab === 'bulk' && (
                  <div className="absolute bottom-0 h-[4px] w-14 bg-[#A970FF] rounded-full left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(169,112,255,0.5)]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("video")}
                className={`flex-1 pb-4 text-center font-bold text-sm transition-all relative ${activeTab === 'video' ? 'text-white' : 'text-[#71767b] hover:text-[#e7e9ea]'}`}
              >
                Video Studio
                {activeTab === 'video' && (
                  <div className="absolute bottom-0 h-[4px] w-14 bg-[#00BA7C] rounded-full left-1/2 -translate-x-1/2 shadow-[0_0_10px_rgba(0,186,124,0.5)]"></div>
                )}
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-4 border-b border-[#2f3336] flex gap-4">
            <div className="flex-shrink-0">
              {/* User Avatar Placeholder with Gradient Ring */}
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#1d9bf0] to-[#7D2AE8] p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                  <img src="https://api.dicebear.com/9.x/micah/svg?seed=AgentX" alt="User" />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3">
              {activeTab === 'post' ? (
                <>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="What is happening?!"
                    className="w-full bg-transparent text-xl placeholder-[#71767b] text-[#e7e9ea] outline-none resize-none min-h-[80px] mt-1 leading-relaxed"
                  />
                  {!postContent && (
                    <div className="border-b border-[#2f3336] pb-3 mb-1">
                      <span className="text-[#1d9bf0] font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-[#1d9bf0]/10 w-fit px-2 py-1 rounded-full transition-colors">
                        <Globe size={14} /> Everyone can reply
                      </span>
                    </div>
                  )}
                </>
              ) : activeTab === 'bulk' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="relative group overflow-hidden rounded-2xl border border-[#333] bg-[#16181c]">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#A970FF]/10 to-[#7D2AE8]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="p-4 flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#A970FF]/20 flex items-center justify-center text-[#A970FF]">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">AI Campaign Mode</h3>
                        <p className="text-[#71767b] text-sm mt-1">Generate 30 days of high-performing content in seconds.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#16181c] rounded-2xl p-2 border border-[#333] focus-within:border-[#A970FF] focus-within:ring-1 focus-within:ring-[#A970FF] transition-all">
                    <textarea
                      value={bulkTopic}
                      onChange={(e) => setBulkTopic(e.target.value)}
                      placeholder="Enter campaign topic (e.g., 'Future of Fintech')..."
                      className="w-full bg-transparent text-lg placeholder-[#71767b] text-white outline-none resize-none min-h-[60px] p-2"
                    />
                  </div>
                </div>
              ) : (
                // Video Tab Content
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  {/* Toggle */}
                  <div className="flex bg-[#16181c] p-1 rounded-full border border-[#333]">
                    <button
                      onClick={() => setVideoMode("ai")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${videoMode === "ai" ? "bg-[#333] text-white shadow-md" : "text-[#71767b] hover:text-white"}`}
                    >
                      AI Generator
                    </button>
                    <button
                      onClick={() => setVideoMode("canva")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${videoMode === "canva" ? "bg-gradient-to-r from-[#5631eb] to-[#7D2AE8] text-white shadow-md" : "text-[#71767b] hover:text-white"}`}
                    >
                      Canva Studio
                    </button>
                  </div>

                  {videoMode === "ai" ? (
                    <>
                      <div className="bg-[#16181c] border border-[#333] rounded-2xl p-4 flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-[#00BA7C]/20 flex items-center justify-center text-[#00BA7C]">
                          <Video size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-white">Viral Reel Generator</p>
                          <p className="text-xs text-[#71767b]">Create engaging short-form videos automatically.</p>
                        </div>
                      </div>
                      <div className="bg-[#16181c] rounded-2xl p-2 border border-[#333] focus-within:border-[#00BA7C] transition-all">
                        <textarea
                          value={videoTopic}
                          onChange={(e) => setVideoTopic(e.target.value)}
                          placeholder="Video idea (e.g. '3 Tips for Productivity')..."
                          className="w-full bg-transparent text-lg placeholder-[#71767b] text-white outline-none resize-none min-h-[60px] p-2"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-4 items-center justify-center p-8 border border-[#333] border-dashed rounded-2xl bg-[#16181c]/50 hover:bg-[#16181c] transition-colors group">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#00C4CC] to-[#7D2AE8] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-900/20">
                        <span className="font-bold text-2xl italic text-white font-serif">C</span>
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-lg text-white">Canva Integration</h3>
                        <p className="text-sm text-[#71767b] mt-1 max-w-xs">Design professional graphics with AgentX templates.</p>
                      </div>
                      <a
                        href="/api/canva/auth"
                        className="bg-white text-black hover:scale-105 font-bold px-6 py-2 rounded-full transition-all shadow-lg text-sm flex items-center gap-2"
                      >
                        <Sparkles size={14} className="text-[#7D2AE8]" /> Connect Account
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex justify-between items-center mt-2 pt-2">
                <div className="flex gap-2">
                  <button className="p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors"><Image size={20} /></button>
                  <button className="p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors"><Layers size={20} /></button>
                  <button className="p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors"><Smile size={20} /></button>
                  <button className="p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors"><Calendar size={20} /></button>
                  <button className="p-2 text-[#1d9bf0] hover:bg-[#1d9bf0]/10 rounded-full transition-colors"><MapPin size={20} /></button>
                </div>

                {/* Dynamic Action Button */}
                {activeTab === 'post' ? (
                  <div className="flex items-center gap-3">
                    {postContent && !isGenerating && (
                      <button
                        onClick={handleGenerate}
                        className="text-[#1d9bf0] text-sm font-bold hover:underline flex items-center gap-1"
                      >
                        <Sparkles size={14} /> Enhance
                      </button>
                    )}
                    <button
                      onClick={handlePost}
                      disabled={!postContent}
                      className={`px-5 py-2 rounded-full font-bold text-sm transition-all shadow-lg ${postContent
                        ? "bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white shadow-[#1d9bf0]/20"
                        : "bg-[#1d9bf0]/50 text-white/50 cursor-not-allowed"
                        }`}
                    >
                      {isGenerating ? "Thinking..." : "Post"}
                    </button>
                  </div>
                ) : activeTab === 'bulk' ? (
                  <button
                    onClick={handleBulkGenerate}
                    disabled={isBulkGenerating || !bulkTopic}
                    className="bg-gradient-to-r from-[#A970FF] to-[#7D2AE8] hover:opacity-90 text-white font-bold px-6 py-2 rounded-full disabled:opacity-50 transition-all shadow-lg shadow-purple-900/30 flex items-center gap-2 text-sm"
                  >
                    {isBulkGenerating ? (
                      <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Generating...</span>
                    ) : (
                      <> <Sparkles size={16} /> <span>Launch Campaign</span> </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleVideoGenerate}
                    disabled={isVideoGenerating || !videoTopic}
                    className="bg-gradient-to-r from-[#00BA7C] to-[#009e69] hover:opacity-90 text-white font-bold px-6 py-2 rounded-full disabled:opacity-50 transition-all shadow-lg shadow-green-900/30 flex items-center gap-2 text-sm"
                  >
                    {isVideoGenerating ? "Creating..." : <><Play size={16} fill="white" /> <span>Generate Reel</span></>}
                  </button>
                )}
              </div>
            </div>
          </div>

          <Feed refreshTrigger={refreshFeed} />

        </main>

        {/* Right Sidebar Placeholder - keeping layout balanced if you add one later */}
        <div className="hidden lg:block w-[350px] ml-8 mt-4">
          <div className="bg-[#16181c] rounded-2xl p-4 border border-[#333] sticky top-4">
            <h2 className="font-bold text-xl mb-4 text-[#e7e9ea]">Trends for you</h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="hover:bg-[#1d1f23] -mx-4 px-4 py-2 transition-colors cursor-pointer">
                  <p className="text-xs text-[#71767b]">Trending in Tech</p>
                  <p className="font-bold text-[#e7e9ea]">#AgentsAI</p>
                  <p className="text-xs text-[#71767b]">{12 + i}K posts</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {showApprovalModal && (
        <ApprovalModal
          tweets={pendingTweets}
          onClose={() => setShowApprovalModal(false)}
          onApprove={handleApproveTweets}
          onReject={handleRejectTweets}
        />
      )}
    </div>
  );
}
