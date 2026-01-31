'use client';

import { useState } from 'react';
import { Play, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function BulkScheduler() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [videosPerAccount, setVideosPerAccount] = useState(10);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const handleSchedule = async () => {
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/youtube/schedule-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videosPerAccount })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to schedule');
            }

            setResult(data);

            // Auto-start processing
            if (data.scheduled > 0) {
                setTimeout(() => startProcessing(), 2000);
            }

        } catch (error: any) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const startProcessing = async () => {
        setProcessing(true);

        try {
            // Get pending videos
            const response = await fetch('/api/youtube/process-pending');
            const { pending } = await response.json();

            if (!pending || pending.length === 0) {
                setProcessing(false);
                return;
            }

            setProgress({ current: 0, total: pending.length });

            // Process each video (generate on client side)
            for (let i = 0; i < pending.length; i++) {
                const item = pending[i];
                setProgress({ current: i + 1, total: pending.length });

                try {
                    // Import renderer dynamically (client-side only)
                    const { renderMemeToVideoBlob } = await import('@/lib/meme-renderer');

                    // Extract texts from meme idea
                    const texts = item.memeIdea.textOverlays.map((t: any) => t.text);

                    // Render video
                    const videoBlob = await renderMemeToVideoBlob(
                        item.memeIdea.templateId,
                        texts
                    );

                    if (!videoBlob) {
                        throw new Error('Failed to render video');
                    }

                    // Save to server
                    const formData = new FormData();
                    formData.append('videoBlob', videoBlob);
                    formData.append('metadata', JSON.stringify({
                        scheduledFor: item.scheduledFor,
                        title: item.memeIdea.title,
                        description: item.memeIdea.description,
                        tags: item.memeIdea.tags,
                        templateId: item.memeIdea.templateId,
                        audioId: item.memeIdea.audioId,
                        accountId: item.accountId
                    }));

                    const saveResponse = await fetch('/api/youtube/save-scheduled', {
                        method: 'POST',
                        body: formData
                    });

                    if (!saveResponse.ok) {
                        throw new Error('Failed to save video');
                    }

                    const { filename } = await saveResponse.json();

                    // Mark as generated
                    await fetch('/api/youtube/process-pending', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: item.id,
                            filename,
                            status: 'GENERATED'
                        })
                    });

                } catch (error) {
                    console.error(`Failed to process video ${i + 1}:`, error);
                    // Continue with next video
                }
            }

            setProcessing(false);
            setProgress({ current: 0, total: 0 });
            alert('All videos generated and scheduled!');

        } catch (error: any) {
            console.error('Processing error:', error);
            setProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">🚀 Automated Multi-Account Posting</h2>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                    Videos per Account
                </label>
                <input
                    type="number"
                    min="1"
                    max="30"
                    value={videosPerAccount}
                    onChange={(e) => setVideosPerAccount(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg"
                    disabled={loading || processing}
                />
                <p className="text-sm text-gray-600 mt-1">
                    Videos will be scheduled at optimal times based on your analytics
                </p>
            </div>

            <button
                onClick={handleSchedule}
                disabled={loading || processing}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Scheduling...
                    </>
                ) : processing ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Videos... ({progress.current}/{progress.total})
                    </>
                ) : (
                    <>
                        <Play className="w-5 h-5" />
                        Start Automated Posting
                    </>
                )}
            </button>

            {result && (
                <div className={`mt-6 p-4 rounded-lg ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                    {result.error ? (
                        <div className="flex items-start gap-2">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-900">Error</p>
                                <p className="text-sm text-red-700">{result.error}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                                <p className="font-semibold text-green-900">Success!</p>
                                <p className="text-sm text-green-700">{result.message}</p>
                                {result.errors && (
                                    <div className="mt-2 text-sm text-orange-700">
                                        <p className="font-medium">Some errors occurred:</p>
                                        <ul className="list-disc list-inside">
                                            {result.errors.map((err: any, i: number) => (
                                                <li key={i}>{err.account}: {err.error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {processing && (
                <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-red-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">
                        Processing video {progress.current} of {progress.total}
                    </p>
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Analyzes your video performance to find optimal posting times</li>
                    <li>Generates unique content for each connected account</li>
                    <li>Creates videos with different templates and topics</li>
                    <li>Schedules uploads at peak engagement hours</li>
                    <li>Automatically uploads when the scheduled time arrives</li>
                </ol>
            </div>
        </div>
    );
}
