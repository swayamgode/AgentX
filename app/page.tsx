"use client";

import { useState } from "react";
import { LeftSidebar } from "@/components/LeftSidebar";
import { RightSidebar } from "@/components/RightSidebar";
import { Feed } from "@/components/Feed";
import ApprovalModal from "@/components/ApprovalModal";
import { Image, Smile, Calendar, MapPin, Layers, Globe, Sparkles } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"post" | "bulk">("post");

  // Single Post State
  const [postContent, setPostContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Bulk State
  const [bulkTopic, setBulkTopic] = useState("");
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);

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
          {/* Header */}
          <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 border-b border-[#333] flex">
            <button
              onClick={() => setActiveTab("post")}
              className={`flex-1 p-4 text-center font-bold relative hover:bg-[#1a1a1a] transition-colors ${activeTab === 'post' ? 'text-white' : 'text-[#71767b]'}`}
            >
              Post
              {activeTab === 'post' && <div className="absolute bottom-0 h-1 w-14 bg-white rounded-full left-1/2 -translate-x-1/2"></div>}
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
              ) : (
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
              )}

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
                  ) : (
                    <button
                      onClick={handleBulkGenerate}
                      disabled={isBulkGenerating || !bulkTopic}
                      className="bg-white text-black hover:bg-[#e5e5e5] font-bold px-5 py-1.5 rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {isBulkGenerating ? "Generating..." : <><Layers size={16} /><span>Launch Campaign</span></>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Feed refreshTrigger={refreshFeed} />

        </main>

        <RightSidebar />
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
