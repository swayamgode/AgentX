import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
    let inputPath: string | null = null;
    let outputPath: string | null = null;

    try {
        const formData = await request.formData();
        const videoFile = formData.get('video') as File;

        if (!videoFile) {
            return NextResponse.json({ error: 'Video file is required' }, { status: 400 });
        }

        // Create temporary file paths
        const tempDir = os.tmpdir();
        const timestamp = Date.now();
        inputPath = path.join(tempDir, `input-${timestamp}.webm`);
        outputPath = path.join(tempDir, `output-${timestamp}.mp4`);

        // Write WebM file to disk
        const buffer = Buffer.from(await videoFile.arrayBuffer());
        await writeFile(inputPath, buffer);

        // Convert using FFmpeg with audio
        // -i: input video file
        // -stream_loop -1: loop audio if shorter than video
        // -i: input audio file
        // -c:v libx264: use H.264 codec for video
        // -preset fast: encoding speed preset
        // -crf 23: quality (lower = better, 23 is good default)
        // -c:a aac: use AAC codec for audio
        // -b:a 128k: audio bitrate
        // -shortest: end when shortest input ends
        // -movflags +faststart: optimize for web streaming

        // Use a simple tone as background music (can be replaced with actual music file)
        const ffmpegCommand = `ffmpeg -i "${inputPath}" -f lavfi -i "sine=frequency=440:duration=6" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -shortest -movflags +faststart "${outputPath}"`;

        console.log('Converting video to MP4 with audio...');
        await execAsync(ffmpegCommand);
        console.log('Conversion complete!');

        // Read converted file
        const mp4Buffer = await readFile(outputPath);

        // Clean up temp files
        await unlink(inputPath);
        await unlink(outputPath);

        // Return MP4 file
        return new NextResponse(mp4Buffer, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Disposition': 'attachment; filename="converted.mp4"'
            }
        });

    } catch (error: any) {
        console.error('Conversion error:', error);

        // Clean up temp files on error
        try {
            if (inputPath) await unlink(inputPath);
            if (outputPath) await unlink(outputPath);
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
        }

        // Check if FFmpeg is installed
        if (error.message?.includes('ffmpeg')) {
            return NextResponse.json({
                error: 'FFmpeg not installed. Please install FFmpeg to enable video conversion.',
                details: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            error: 'Video conversion failed',
            details: error.message
        }, { status: 500 });
    }
}
