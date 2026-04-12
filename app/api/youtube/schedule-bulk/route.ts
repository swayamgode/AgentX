import { NextRequest, NextResponse } from 'next/server';
import { multiAccountStorage } from '@/lib/token-storage';
import { generateBulkMemes, MemeIdea } from '@/lib/ai-meme-generator';
import { getAuthUser } from '@/lib/auth-util';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videosPerAccount = 10 } = body;

        // 1. Get current user
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = user.id;

        // 2. Get all accounts for this user
        const accounts = await multiAccountStorage.getAllAccounts(userId);
        if (accounts.length === 0) {
            return NextResponse.json(
                { error: 'No YouTube accounts connected' },
                { status: 400 }
            );
        }

        // 3. Load topics
        const topicsFile = path.join(process.cwd(), 'topics.txt');
        let topics = ['coding', 'developer life', 'bugs', 'deployment', 'javascript'];

        if (fs.existsSync(topicsFile)) {
            const fileContent = fs.readFileSync(topicsFile, 'utf-8');
            const splitTopics = fileContent
                .split('\n')
                .map(t => t.trim())
                .filter(t => t.length > 2 && !t.startsWith('#'));
            if (splitTopics.length > 0) topics = splitTopics;
        }

        const scheduledVideos: any[] = [];
        const errors: any[] = [];

        const { keyManager } = await import('@/lib/key-manager');

        const accountPromises = accounts.map(async (account: any) => {
            try {
                const rotatedApiKey = keyManager.getNextKey();
                if (!rotatedApiKey) {
                    throw new Error('No Gemini API key available');
                }

                // Default optimal hour
                const optimalHour = 18;

                // Pick random topic for this account
                const topic = topics[Math.floor(Math.random() * topics.length)];

                // Generate meme ideas
                const ideas = await generateBulkMemes({
                    topic,
                    count: videosPerAccount,
                    includeAudio: true
                }, rotatedApiKey);

                const accountVideos = [];
                // Schedule videos across multiple days at optimal time
                for (let i = 0; i < ideas.length; i++) {
                    const scheduleDate = new Date();
                    scheduleDate.setDate(scheduleDate.getDate() + i);
                    scheduleDate.setHours(optimalHour, 0, 0, 0);

                    // If first video time is in past, move to tomorrow
                    if (i === 0 && scheduleDate < new Date()) {
                        scheduleDate.setDate(scheduleDate.getDate() + 1);
                    }

                    accountVideos.push({
                        id: `${account.id}-${Date.now()}-${i}`,
                        accountId: account.id,
                        accountName: account.channelName,
                        scheduledFor: scheduleDate.toISOString(),
                        memeIdea: ideas[i],
                        status: 'PENDING_GENERATION'
                    });
                }
                return { videos: accountVideos, error: null };

            } catch (error: any) {
                return {
                    videos: [],
                    error: {
                        account: account.channelName,
                        error: error.message
                    }
                };
            }
        });

        const results = await Promise.all(accountPromises);

        for (const res of results) {
            if (res.error) {
                errors.push(res.error);
            }
            if (res.videos.length > 0) {
                scheduledVideos.push(...res.videos);
            }
        }

        // Save to pending file for processing
        const pendingFile = path.join(process.cwd(), 'public', 'pending-batch.json');
        const existingData = fs.existsSync(pendingFile)
            ? JSON.parse(fs.readFileSync(pendingFile, 'utf-8'))
            : [];

        const updatedData = [...existingData, ...scheduledVideos];
        fs.writeFileSync(pendingFile, JSON.stringify(updatedData, null, 2));

        return NextResponse.json({
            success: true,
            scheduled: scheduledVideos.length,
            accounts: accounts.length,
            errors: errors.length > 0 ? errors : undefined,
            message: `Scheduled ${scheduledVideos.length} videos across ${accounts.length} accounts`
        });

    } catch (error: any) {
        console.error('Bulk scheduling error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to schedule bulk videos' },
            { status: 500 }
        );
    }
}
