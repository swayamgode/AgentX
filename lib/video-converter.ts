/**
 * Video Converter Utility
 * Converts canvas content to video format for social media posting
 */

export interface VideoOptions {
    duration?: number; // Duration in seconds (default: 5)
    fps?: number; // Frames per second (default: 30)
    format?: 'webm' | 'mp4'; // Video format
}

/**
 * Convert canvas to video blob
 * Creates a video from a static canvas image
 */
export async function canvasToVideoBlob(
    canvas: HTMLCanvasElement,
    options: VideoOptions = {}
): Promise<Blob> {
    const {
        duration = 5,
        fps = 30,
        format = 'webm'
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
        videoBitsPerSecond: 5000000 // 5 Mbps for good quality
    });

    const chunks: Blob[] = [];

    return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            resolve(blob);
        };

        mediaRecorder.onerror = (error) => {
            reject(error);
        };

        // Start recording
        mediaRecorder.start();

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
