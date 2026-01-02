
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { PuppeteerScreenRecorder } from "puppeteer-screen-recorder";
import fs from "fs";
import path from "path";
import os from "os";
// import ffmpeg from "ffmpeg-static";
// FFMPEG Static install failed. Relying on system FFMPEG or failing gracefully.

export async function POST(req: NextRequest) {
    let browser = null;
    const tempFilePath = path.join(os.tmpdir(), `video-${Date.now()}.mp4`);

    try {
        const { html } = await req.json();

        if (!html) {
            return NextResponse.json({ error: "No HTML provided" }, { status: 400 });
        }

        // Launch Browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--window-size=1080,1920' // Ensure window size matches
            ],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1920 });

        // Set Content
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Initialize Recorder
        // Note: This relies on system FFMPEG being available.
        const recorder = new PuppeteerScreenRecorder(page);

        // Start recording
        await recorder.start(tempFilePath);

        // Wait for animation (e.g., 5 seconds)
        await new Promise(r => setTimeout(r, 5000));

        // Stop recording
        await recorder.stop();
        await browser.close();
        browser = null; // Prevent double close

        // Read file and send
        const videoBuffer = fs.readFileSync(tempFilePath);

        // Cleanup temp file
        fs.unlinkSync(tempFilePath);

        return new NextResponse(videoBuffer, {
            headers: {
                "Content-Type": "video/mp4",
                "Content-Disposition": 'attachment; filename="reel.mp4"',
            },
        });

    } catch (error) {
        console.error("Export error:", error);
        if (browser) await browser.close();
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

        return NextResponse.json(
            { error: "Export failed - Server configuration or FFMPEG missing." },
            { status: 500 }
        );
    }
}
