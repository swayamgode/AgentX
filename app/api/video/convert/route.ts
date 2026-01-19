import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile, readdir } from 'fs/promises';
import path from 'path';
import os from 'os';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
    let inputPath: string | null = null;
    let outputPath: string | null = null;
    let tempAudioPath: string | null = null;

    try {
        const formData = await request.formData();
        const videoFile = formData.get('video') as File;
        const requestedAudioId = formData.get('audioId') as string;

        // Optional: Allow converting without adding music if "none" is passed
        const useMusic = requestedAudioId !== 'none';

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

        // Determine audio source
        let audioInput = '';
        let audioFilter = '';

        if (useMusic) {
            const musicDir = path.join(process.cwd(), 'public', 'music', 'royalty-free');
            let selectedMusicFile = '';

            // Try to find specific requested file or random
            if (fs.existsSync(musicDir)) {
                const files = await readdir(musicDir);
                const mp3Files = files.filter(f => f.endsWith('.mp3'));

                if (mp3Files.length > 0) {
                    if (requestedAudioId) {
                        // Try to find match (assuming requestedAudioId is like 'rise-up')
                        // Map ID to filename logic or just search
                        // We might need to look up in metadata.json but simple matching is faster for now
                        // If requestedAudioId matches a filename, use it
                        const match = mp3Files.find(f => f.includes(requestedAudioId) || f === requestedAudioId);
                        selectedMusicFile = match || mp3Files[Math.floor(Math.random() * mp3Files.length)];
                    } else {
                        // Pick random
                        selectedMusicFile = mp3Files[Math.floor(Math.random() * mp3Files.length)];
                    }
                }
            }

            if (selectedMusicFile) {
                const musicPath = path.join(musicDir, selectedMusicFile);
                console.log('🎵 Using music track:', selectedMusicFile);
                // -stream_loop -1 loops the audio input indefinitely (must be before -i)
                // -shortest cuts the output to the shortest input (the video)
                // Volume adjustment might be needed: af "volume=0.5"
                audioInput = `-stream_loop -1 -i "${musicPath}"`;
                // Mix audio? The video usually has no audio, so we map the music to output
                // If video has audio, we might want to mix. For now assuming video is silent or we replace it.
                audioFilter = '-map 0:v -map 1:a -shortest';
            } else {
                console.log('⚠️ No music files found, using silence.');
                // Fallback to silent or generate tone if we really want
                // audioInput = '-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100';
                // audioFilter = '-shortest';
                // Actually, if no music found, just process video without audio if original had none, 
                // or keep original audio.
                // But the user expects music. Let's fallback to the sine wave but quieter as it was annoying?
                // No, silence is better than a loud beep.
            }
        }

        // FFMPEG Command Construction
        let ffmpegCommand;

        if (audioInput) {
            ffmpegCommand = `ffmpeg -i "${inputPath}" ${audioInput} -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 192k ${audioFilter} -movflags +faststart "${outputPath}"`;
        } else {
            // No music added, just convert
            ffmpegCommand = `ffmpeg -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -an -movflags +faststart "${outputPath}"`;
        }

        console.log('Converting video...');
        // console.log('Command:', ffmpegCommand); 
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
            if (inputPath && fs.existsSync(inputPath)) await unlink(inputPath);
            if (outputPath && fs.existsSync(outputPath)) await unlink(outputPath);
        } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
        }

        return NextResponse.json({
            error: 'Video conversion failed',
            details: error.message
        }, { status: 500 });
    }
}
