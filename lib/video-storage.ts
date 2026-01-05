/**
 * Video Storage Manager
 * Handles local storage of generated videos with proper naming
 */

import fs from 'fs';
import path from 'path';

export interface VideoMetadata {
    filename: string;
    path: string;
    scheduledFor: Date;
    title: string;
    description: string;
    tags: string[];
    templateId: string;
    audioId: string | null;
}

/**
 * Generate filename with date and time
 * Format: YYYY-MM-DD_HH-mm-ss_template-name.webm
 */
export function generateVideoFilename(
    templateId: string,
    scheduledFor: Date
): string {
    const year = scheduledFor.getFullYear();
    const month = String(scheduledFor.getMonth() + 1).padStart(2, '0');
    const day = String(scheduledFor.getDate()).padStart(2, '0');
    const hours = String(scheduledFor.getHours()).padStart(2, '0');
    const minutes = String(scheduledFor.getMinutes()).padStart(2, '0');
    const seconds = String(scheduledFor.getSeconds()).padStart(2, '0');

    const dateStr = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    const sanitizedTemplate = templateId.replace(/[^a-z0-9-]/gi, '-');

    return `${dateStr}_${sanitizedTemplate}.webm`;
}

/**
 * Get videos directory path
 */
export function getVideosDirectory(): string {
    // Store in public/generated-videos for easy access
    const videosDir = path.join(process.cwd(), 'public', 'generated-videos');

    // Create directory if it doesn't exist
    if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir, { recursive: true });
    }

    return videosDir;
}

/**
 * Save video blob to local storage
 */
export async function saveVideoLocally(
    videoBlob: Blob,
    metadata: Omit<VideoMetadata, 'filename' | 'path'>
): Promise<VideoMetadata> {
    const filename = generateVideoFilename(metadata.templateId, metadata.scheduledFor);
    const videosDir = getVideosDirectory();
    const filePath = path.join(videosDir, filename);

    // Convert blob to buffer
    const arrayBuffer = await videoBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Write to file
    fs.writeFileSync(filePath, buffer);

    // Also save metadata JSON
    const metadataPath = filePath.replace('.webm', '.json');
    fs.writeFileSync(
        metadataPath,
        JSON.stringify({
            ...metadata,
            filename,
            savedAt: new Date().toISOString(),
        }, null, 2)
    );

    return {
        ...metadata,
        filename,
        path: filePath,
    };
}

/**
 * Get public URL for video
 */
export function getVideoUrl(filename: string): string {
    return `/generated-videos/${filename}`;
}

/**
 * List all generated videos
 */
export function listGeneratedVideos(): VideoMetadata[] {
    const videosDir = getVideosDirectory();

    if (!fs.existsSync(videosDir)) {
        return [];
    }

    const files = fs.readdirSync(videosDir);
    const metadataFiles = files.filter(f => f.endsWith('.json'));

    return metadataFiles.map(file => {
        const content = fs.readFileSync(path.join(videosDir, file), 'utf-8');
        return JSON.parse(content);
    }).sort((a, b) => {
        return new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime();
    });
}

/**
 * Delete video and metadata
 */
export function deleteVideo(filename: string): boolean {
    const videosDir = getVideosDirectory();
    const videoPath = path.join(videosDir, filename);
    const metadataPath = videoPath.replace('.webm', '.json');

    try {
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }
        if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath);
        }
        return true;
    } catch (error) {
        console.error('Failed to delete video:', error);
        return false;
    }
}

/**
 * Get video file as buffer
 */
export function getVideoBuffer(filename: string): Buffer | null {
    const videosDir = getVideosDirectory();
    const videoPath = path.join(videosDir, filename);

    if (!fs.existsSync(videoPath)) {
        return null;
    }

    return fs.readFileSync(videoPath);
}
