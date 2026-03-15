import puppeteer from 'puppeteer';
import * as path from 'path';

/**
 * Headless Render Worker
 * Runs a background browser instance to process the video rendering queue.
 */

async function runWorker() {
    console.log('[RENDER WORKER] Starting background browser...');
    
    try {
        const browser = await puppeteer.launch({
            headless: true, // Use false if you want to see what's happening
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--mute-audio',
                '--disable-web-security',
                '--gpu-no-context-lost-timeout', // important for canvas recording
            ]
        });

        const page = await browser.newPage();
        
        // Set viewport to 1080x1920 (Shorts format) or standard
        await page.setViewport({ width: 1280, height: 800 });

        console.log('[RENDER WORKER] Navigating to worker page...');
        
        // Use localhost since dev server should be running
        const url = 'http://localhost:3000/render-worker';
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        } catch (e) {
            console.error('[RENDER WORKER] Navigation failed. Is the server running at localhost:3000?');
            await browser.close();
            process.exit(1);
        }

        console.log('[RENDER WORKER] Page loaded. Monitoring logs...');

        // Relay console logs from the page back to the terminal
        page.on('console', msg => {
            if (msg.text().includes('[RENDER WORKER]') || msg.text().includes('Success') || msg.text().includes('Failed')) {
                console.log(`[BROWSER LOG] ${msg.text()}`);
            }
        });

        // Loop forever
        while (true) {
            // Check for crashes
            if (browser.process()?.exitCode !== null) {
                console.error('[RENDER WORKER] Browser crashed. Restarting...');
                break;
            }
            
            // Stay alive
            await new Promise(r => setTimeout(r, 60000));
            console.log(`[${new Date().toLocaleTimeString()}] Render worker heartbeat...`);
        }

    } catch (error: any) {
        console.error('[RENDER WORKER] Critical internal error:', error.message);
        process.exit(1);
    }
}

// Start the worker
runWorker();
