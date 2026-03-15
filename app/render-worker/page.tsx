'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Video, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Render Worker Page
 * Focused purely on processing the PENDING_GENERATION queue automatically.
 * Designed for headless or background browser use.
 */
export default function RenderWorkerPage() {
    const [status, setStatus] = useState<'idle' | 'fetching' | 'rendering' | 'saving' | 'error'>('idle');
    const [currentTask, setCurrentTask] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [stats, setStats] = useState({ successful: 0, failed: 0 });
    
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    useEffect(() => {
        const interval = setInterval(() => {
            if (status === 'idle') {
                processNext();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [status]);

    const processNext = async () => {
        setStatus('fetching');
        try {
            const res = await fetch('/api/youtube/process-pending');
            const { pending } = await res.json();

            if (!pending || pending.length === 0) {
                setStatus('idle');
                return;
            }

            const task = pending[0]; // Take the first one
            setCurrentTask(task);
            await renderTask(task);
        } catch (err: any) {
            addLog(`Error fetching: ${err.message}`);
            setStatus('idle');
        }
    };

    const renderTask = async (task: any) => {
        setStatus('rendering');
        addLog(`🎬 Rendering: ${task.memeIdea.title} for ${task.accountName}`);
        
        try {
            // Import renderer logic
            // Since we need the premium effects, we'll use a simplified version of the logic
            // or better, we can import the existing renderMemeToVideoBlob if it's exported correctly
            const { renderMemeToVideoBlob } = await import('@/lib/meme-renderer');
            
            const texts = task.memeIdea.textOverlays.map((t: any) => t.text);
            const videoBlob = await renderMemeToVideoBlob(task.memeIdea.templateId, texts);

            if (!videoBlob) throw new Error("Failed to generate video blob");

            setStatus('saving');
            addLog("💾 Saving to server...");

            const formData = new FormData();
            formData.append('videoBlob', videoBlob);
            formData.append('metadata', JSON.stringify({
                scheduledFor: task.scheduledFor,
                title: task.memeIdea.title,
                description: task.memeIdea.description,
                tags: task.memeIdea.tags,
                templateId: task.memeIdea.templateId,
                audioId: task.memeIdea.audioId,
                accountId: task.accountId
            }));

            const saveRes = await fetch('/api/youtube/save-scheduled', {
                method: 'POST',
                body: formData
            });

            if (!saveRes.ok) throw new Error("Failed to save video");
            
            const { filename } = await saveRes.json();

            // Mark as generated
            await fetch('/api/youtube/process-pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: task.id,
                    filename,
                    status: 'GENERATED'
                })
            });

            addLog(`✅ Success! Video saved as ${filename}`);
            setStats(s => ({ ...s, successful: s.successful + 1 }));
            setStatus('idle');
            setCurrentTask(null);

        } catch (err: any) {
            addLog(`❌ Render Failed: ${err.message}`);
            setStats(s => ({ ...s, failed: s.failed + 1 }));
            
            // Mark as failed so we don't loop forever
            await fetch('/api/youtube/process-pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: task.id,
                    status: 'FAILED'
                })
            });
            
            setStatus('idle');
            setCurrentTask(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f12] text-white p-8 font-mono">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <Video className="w-8 h-8 text-indigo-500" />
                            RENDER WORKER <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">V1.0</span>
                        </h1>
                        <p className="text-gray-500 mt-1">Status: <span className={status === 'rendering' ? 'text-green-400' : 'text-indigo-400'}>{status.toUpperCase()}</span></p>
                    </div>
                    
                    <div className="text-right space-y-1">
                        <div className="text-xs text-gray-500 uppercase font-bold">Session Stats</div>
                        <div className="flex gap-4">
                            <span className="text-green-400">SUCCESS: {stats.successful}</span>
                            <span className="text-red-400">FAILED: {stats.failed}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                {currentTask ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{currentTask.memeIdea.title}</h2>
                                <p className="text-gray-400 text-sm">Target: {currentTask.accountName}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                                <div className="text-gray-500 uppercase text-[10px] mb-1">Template</div>
                                <div>{currentTask.memeIdea.templateId}</div>
                            </div>
                            <div className="bg-black/40 p-4 rounded-lg border border-white/5">
                                <div className="text-gray-500 uppercase text-[10px] mb-1">Scheduled For</div>
                                <div>{new Date(currentTask.scheduledFor).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <div className="flex justify-between text-xs text-gray-400">
                                <span>Rendering Progress</span>
                                <span>{status === 'rendering' ? 'Processing Frames...' : status === 'saving' ? 'Uploding to Buffer...' : 'Waiting...'}</span>
                             </div>
                             <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full transition-all duration-500 ${status === 'rendering' ? 'bg-indigo-500' : 'bg-green-500'}`}
                                    style={{ width: status === 'idle' ? '0%' : status === 'rendering' ? '60%' : '100%' }}
                                 />
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center text-gray-500">
                        <Loader2 className="w-8 h-8 mx-auto mb-4 opacity-20 animate-spin" />
                        <p>Waiting for pending generation tasks...</p>
                        <p className="text-xs mt-2">The scheduler will automatically populate this queue.</p>
                    </div>
                )}

                {/* Log Console */}
                <div className="bg-black rounded-xl border border-white/10 overflow-hidden">
                    <div className="bg-white/5 px-4 py-2 text-xs font-bold text-gray-400 flex justify-between items-center">
                        <span>SYSTEM LOGS</span>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                        </div>
                    </div>
                    <div className="p-4 h-64 overflow-y-auto font-mono text-sm space-y-1">
                        {logs.length === 0 && <div className="text-gray-700 italic">No activity logs yet...</div>}
                        {logs.map((log, i) => (
                            <div key={i} className={`flex gap-3 ${i === 0 ? 'text-indigo-300' : 'text-gray-500'}`}>
                                <span className="opacity-30">{logs.length - i}.</span>
                                <span className="whitespace-pre-wrap">{log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
