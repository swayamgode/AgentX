
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { multiAccountStorage } from '../lib/token-storage';
import { generateBulkMemes, MemeIdea } from '../lib/ai-meme-generator';
import { getOptimalUploadHour } from '../lib/analytics-util';

// Load env
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Output file
const PENDING_FILE = path.join(process.cwd(), 'public', 'pending-batch.json');

interface BatchItem {
    id: string;
    accountId: string;
    accountName: string;
    scheduledFor: string;
    memeIdea: MemeIdea;
    status: 'PENDING';
}

async function run() {
    const apiKey = process.env.GOOGLE_API_KEY; // OR GEMINI key
    if (!apiKey) {
        console.error("Missing GOOGLE_API_KEY");
        process.exit(1);
    }

    const userId = 'dev-id-001';
    const accounts = multiAccountStorage.getAllAccounts(userId);
    console.log(`Found ${accounts.length} accounts.`);

    const allPending: BatchItem[] = [];

    // Topics list - randomize or use topics.txt
    const topicsFile = path.join(process.cwd(), 'topics.txt');
    let topics = ['coding', 'developer life', 'bugs', 'deployment', 'javascript'];
    if (fs.existsSync(topicsFile)) {
        const fileContent = fs.readFileSync(topicsFile, 'utf-8');
        const splitTopics = fileContent.split('\n').map(t => t.trim()).filter(t => t.length > 2 && !t.startsWith('#'));
        if (splitTopics.length > 0) topics = splitTopics;
    }

    for (const account of accounts) {
        console.log(`Planning for ${account.channelName}...`);

        // 1. Determine Schedule
        const optimalHour = getOptimalUploadHour(account.id);
        console.log(`  Optimal hour: ${optimalHour}:00`);

        // 2. Generate Ideas
        // Pick a random topic
        const topic = topics[Math.floor(Math.random() * topics.length)];
        console.log(`  Topic: ${topic}`);

        try {
            const ideas = await generateBulkMemes({
                topic,
                count: 10,
                includeAudio: true
            }, apiKey);

            // 3. Assign Times
            const today = new Date();
            // Start tomorrow or today + 1 hour? Let's say we schedule starting tomorrow if optimal hour passed, 
            // or perform a spread.
            // User said: "10 videos... upload on the time i get reach"
            // Let's schedule 1 per day at optimal hour, for 10 days.

            for (let i = 0; i < ideas.length; i++) {
                const scheduleDate = new Date();
                scheduleDate.setDate(scheduleDate.getDate() + i); // Today + i days
                scheduleDate.setHours(optimalHour, 0, 0, 0);

                // If time is in past (e.g. today 6PM and it's 8PM), move to next day? 
                // Handled implicitly if we blindly add days. But for i=0 (today), check:
                if (i === 0 && scheduleDate < new Date()) {
                    scheduleDate.setDate(scheduleDate.getDate() + 1); // Move to tomorrow
                }

                allPending.push({
                    id: `${account.id}-${Date.now()}-${i}`,
                    accountId: account.id,
                    accountName: account.channelName,
                    scheduledFor: scheduleDate.toISOString(),
                    memeIdea: ideas[i],
                    status: 'PENDING'
                });
            }

            console.log(`  Planned ${ideas.length} videos.`);

        } catch (error) {
            console.error(`  Failed to generate ideas for ${account.channelName}:`, error);
        }
    }

    // Save
    fs.writeFileSync(PENDING_FILE, JSON.stringify(allPending, null, 2));
    console.log(`Saved ${allPending.length} pending items to ${PENDING_FILE}`);
}

run();
