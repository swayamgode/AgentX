/**
 * Enhanced Video Editor
 * Combines video templates with text overlays and audio
 */

import { VideoTemplate, VideoTextOverlay } from './video-templates';
import { AudioTrack } from './audio-library';

export interface VideoEditorOptions {
    template: VideoTemplate;
    textOverlays: VideoTextOverlay[];
    audioTrack?: AudioTrack;
    outputFormat?: 'webm' | 'mp4';
}

/**
 * Create video with text overlays and audio using canvas and MediaRecorder
 * This is a client-side solution with limitations
 */
export async function createVideoWithOverlays(
    videoElement: HTMLVideoElement,
    options: VideoEditorOptions
): Promise<Blob> {
    const { template, textOverlays, audioTrack } = options;

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = 1080; // Reels format width
    canvas.height = 1920; // Reels format height
    const ctx = canvas.getContext('2d')!;

    // Calculate video dimensions (centered)
    const videoAspect = template.width / template.height;
    let videoWidth = 1080;
    let videoHeight = 1080;

    if (videoAspect > 1) {
        videoHeight = 1080 / videoAspect;
    } else if (videoAspect < 1) {
        videoWidth = 1080 * videoAspect;
    }

    const videoX = (1080 - videoWidth) / 2;
    const videoY = (1920 - videoHeight) / 2;

    // Create stream from canvas
    const stream = canvas.captureStream(30); // 30 FPS

    // Add audio track if provided
    if (audioTrack && audioTrack.audioUrl) {
        const audio = new Audio(audioTrack.audioUrl);
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(audio);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);

        // Add audio track to stream
        const audioTracks = destination.stream.getAudioTracks();
        audioTracks.forEach(track => stream.addTrack(track));

        audio.play();
    }

    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000,
    });

    const chunks: Blob[] = [];

    return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            resolve(blob);
        };

        mediaRecorder.onerror = reject;

        // Start recording
        mediaRecorder.start();

        // Render loop
        const startTime = Date.now();
        const duration = template.duration * 1000;

        function render() {
            const currentTime = (Date.now() - startTime) / 1000;

            if (currentTime >= template.duration) {
                mediaRecorder.stop();
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            // Fill background
            const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
            gradient.addColorStop(0, '#0a0a0a');
            gradient.addColorStop(0.5, '#1a1a1a');
            gradient.addColorStop(1, '#0a0a0a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1920);

            // Draw video frame
            ctx.drawImage(videoElement, videoX, videoY, videoWidth, videoHeight);

            // Draw text overlays
            textOverlays.forEach(overlay => {
                if (currentTime >= overlay.startTime && currentTime <= overlay.endTime) {
                    drawTextOverlay(ctx, overlay, currentTime - overlay.startTime);
                }
            });

            requestAnimationFrame(render);
        }

        // Start video playback and rendering
        videoElement.currentTime = 0;
        videoElement.play();
        render();
    });
}

/**
 * Draw text overlay with animations
 */
function drawTextOverlay(
    ctx: CanvasRenderingContext2D,
    overlay: VideoTextOverlay,
    elapsed: number
) {
    ctx.save();

    // Calculate position
    const x = (1080 * overlay.x) / 100;
    let y = (1920 * overlay.y) / 100;

    // Apply animation
    let opacity = 1;
    if (overlay.animation === 'fade') {
        opacity = Math.min(elapsed / 0.5, 1); // Fade in over 0.5s
    } else if (overlay.animation === 'slide') {
        const slideProgress = Math.min(elapsed / 0.5, 1);
        y = y - (50 * (1 - slideProgress)); // Slide from top
    } else if (overlay.animation === 'bounce') {
        const bounceProgress = Math.min(elapsed / 0.3, 1);
        const bounce = Math.sin(bounceProgress * Math.PI) * 20;
        y = y - bounce;
    }

    ctx.globalAlpha = opacity;

    // Draw background if specified
    if (overlay.backgroundColor) {
        ctx.fillStyle = overlay.backgroundColor;
        const metrics = ctx.measureText(overlay.text);
        const padding = 20;
        const bgWidth = metrics.width + padding * 2;
        const bgHeight = overlay.fontSize + padding;
        ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);
    }

    // Draw text
    ctx.font = `bold ${overlay.fontSize}px Arial, sans-serif`;
    ctx.fillStyle = overlay.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Add text stroke for better visibility
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.strokeText(overlay.text, x, y);
    ctx.fillText(overlay.text, x, y);

    ctx.restore();
}

/**
 * Load video element from URL
 */
export function loadVideo(url: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.src = url;
        video.muted = true; // Mute original audio
        video.loop = false;

        video.onloadedmetadata = () => {
            resolve(video);
        };

        video.onerror = reject;
    });
}

/**
 * Preload audio track
 */
export function loadAudio(url: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.crossOrigin = 'anonymous';

        audio.oncanplaythrough = () => {
            resolve(audio);
        };

        audio.onerror = reject;
        audio.load();
    });
}
