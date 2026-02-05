/**
 * Video Converter Utility
 * Converts canvas content to video format for social media posting
 */

export interface VideoOptions {
    duration?: number; // Duration in seconds (default: 5)
    fps?: number; // Frames per second (default: 30)
    format?: 'webm' | 'mp4'; // Video format
    onFrame?: (progress: number) => void; // Animation callback (0 to 1)
}

/**
 * Convert canvas to video blob
 * creates high-quality video with optional animation support
 */
export async function canvasToVideoBlob(
    canvas: HTMLCanvasElement,
    options: VideoOptions = {}
): Promise<Blob> {
    const {
        duration = 5,
        fps = 30,
        format = 'webm',
        onFrame
    } = options;

    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
        throw new Error('MediaRecorder API is not supported in this browser');
    }

    // Create a video stream from canvas
    const stream = canvas.captureStream(fps);

    // Determine MIME type
    const mimeType = format === 'mp4'
        ? 'video/mp4'
        : 'video/webm;codecs=vp9';

    // Check if the MIME type is supported
    if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`${mimeType} not supported, falling back to default`);
    }

    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
        videoBitsPerSecond: 8000000 // 8 Mbps for high quality
    });

    const chunks: Blob[] = [];

    return new Promise((resolve, reject) => {
        let animationFrameId: number;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            const blob = new Blob(chunks, { type: mimeType });
            resolve(blob);
        };

        mediaRecorder.onerror = (error) => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            reject(error);
        };

        // Start recording
        mediaRecorder.start();

        // Start animation loop if requested
        if (onFrame) {
            const startTime = performance.now();

            const animate = () => {
                const elapsed = (performance.now() - startTime) / 1000;
                const rawProgress = elapsed / duration;
                const progress = Math.min(Math.max(rawProgress, 0), 1);

                onFrame(progress);

                if (elapsed < duration) {
                    animationFrameId = requestAnimationFrame(animate);
                }
            };

            animate();
        }

        // Stop after specified duration
        setTimeout(() => {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
        }, duration * 1000);
    });
}

/**
 * Download video blob as file
 */
export function downloadVideoBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Convert blob to base64 string
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Upload video blob to server
 */
export async function uploadVideoToServer(
    blob: Blob,
    endpoint: string,
    metadata: Record<string, any> = {}
): Promise<Response> {
    const formData = new FormData();
    formData.append('video', blob, 'meme-reel.webm');

    // Add metadata
    Object.entries(metadata).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
    });

    return fetch(endpoint, {
        method: 'POST',
        body: formData,
    });
}
