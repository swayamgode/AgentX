"use client";

import { useState } from "react";
import { X, Check, Trash2, Edit2, Calendar } from "lucide-react";

interface Tweet {
    id: string;
    content: string;
    scheduledFor: string;
    status: string;
}

interface ApprovalModalProps {
    tweets: Tweet[];
    onClose: () => void;
    onApprove: (tweetIds: string[]) => Promise<void>;
    onReject: (tweetIds: string[]) => Promise<void>;
}

export default function ApprovalModal({ tweets, onClose, onApprove, onReject }: ApprovalModalProps) {
    const [selectedTweets, setSelectedTweets] = useState<Set<string>>(new Set(tweets.map(t => t.id)));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [localTweets, setLocalTweets] = useState(tweets);
    const [loading, setLoading] = useState(false);

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedTweets);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedTweets(newSelected);
    };

    const startEdit = (tweet: Tweet) => {
        setEditingId(tweet.id);
        setEditContent(tweet.content);
    };

    const saveEdit = async (tweetId: string) => {
        try {
            const res = await fetch("/api/tweets/edit", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tweetId, content: editContent })
            });

            if (res.ok) {
                setLocalTweets(localTweets.map(t =>
                    t.id === tweetId ? { ...t, content: editContent } : t
                ));
                setEditingId(null);
            }
        } catch (error) {
            console.error("Error updating tweet:", error);
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            await onApprove(Array.from(selectedTweets));
            onClose();
        } catch (error) {
            console.error("Error approving tweets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        const unselected = localTweets.filter(t => !selectedTweets.has(t.id)).map(t => t.id);
        if (unselected.length === 0) {
            onClose();
            return;
        }

        setLoading(true);
        try {
            await onReject(unselected);
            onClose();
        } catch (error) {
            console.error("Error rejecting tweets:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="fixed inset-0 bg-[#5b7083]/40 flex items-center justify-center z-50 p-4">
            <div className="bg-black rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-[#2f3336]">
                {/* Header */}
                <div className="p-4 border-b border-[#2f3336] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[#e7e9ea]">Review Generated Tweets</h2>
                        <p className="text-sm text-[#71767b] mt-1">
                            {selectedTweets.size} of {localTweets.length} tweets selected
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-[#e7e9ea] hover:bg-[#181818] p-2 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tweet List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {localTweets.map((tweet, index) => (
                        <div
                            key={tweet.id}
                            className={`border rounded-xl p-4 transition-all cursor-pointer ${selectedTweets.has(tweet.id)
                                ? "border-white bg-white/5"
                                : "border-[#333] bg-black hover:bg-[#1a1a1a]"
                                }`}
                            onClick={() => toggleSelect(tweet.id)}
                        >
                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <input
                                    type="checkbox"
                                    checked={selectedTweets.has(tweet.id)}
                                    onChange={() => toggleSelect(tweet.id)}
                                    className="mt-1 w-4 h-4 accent-white bg-transparent border-[#71767b] rounded focus:ring-2 focus:ring-white"
                                />

                                {/* Content */}
                                <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-medium text-[#71767b]">Day {index + 1}</span>
                                        <div className="flex items-center gap-1 text-xs text-[#71767b]">
                                            <Calendar className="w-3 h-3" />
                                            {formatDate(tweet.scheduledFor)}
                                        </div>
                                    </div>

                                    {editingId === tweet.id ? (
                                        <div>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full p-2 bg-black border border-[#333] text-[#e7e9ea] rounded-lg focus:outline-none focus:border-white resize-none"
                                                rows={3}
                                                maxLength={280}
                                            />
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-[#71767b]">
                                                    {editContent.length}/280
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="text-sm text-[#e7e9ea] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#181818]"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => saveEdit(tweet.id)}
                                                        className="text-sm bg-white text-black font-bold px-3 py-1.5 rounded-lg hover:bg-[#e5e5e5]"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-[#e7e9ea] text-[15px] leading-normal">{tweet.content}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    onClick={() => startEdit(tweet)}
                                                    className="text-xs text-white hover:underline flex items-center gap-1"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                    Edit
                                                </button>
                                                <span className="text-xs text-[#71767b]">•</span>
                                                <span className="text-xs text-[#71767b]">
                                                    {tweet.content.length} characters
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#333] flex items-center justify-between bg-black rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[#e7e9ea] font-bold hover:bg-[#181818] rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleReject}
                            disabled={loading}
                            className="px-4 py-2 border border-[#333] text-[#e7e9ea] font-bold rounded-xl hover:bg-[#16181c] disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Reject Unselected
                        </button>
                        <button
                            onClick={handleApprove}
                            disabled={loading || selectedTweets.size === 0}
                            className="px-6 py-2 bg-white text-black font-bold rounded-xl hover:bg-[#e5e5e5] disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            <Check className="w-4 h-4" />
                            Approve {selectedTweets.size}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
