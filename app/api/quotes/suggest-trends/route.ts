import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST() {
    try {
        const filePath = path.join(process.cwd(), 'topics.txt');

        let fileContent = '';
        try {
            fileContent = await fs.readFile(filePath, 'utf-8');
        } catch (err) {
            console.error('Error reading topics.txt, falling back to defaults:', err);
            return NextResponse.json({
                topics: ["Motivation", "Discipline", "Success", "Stoicism", "Wisdom"]
            });
        }

        // Parse lines
        const allLines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Filter out headers (lines with emojis or looking like categories) and instructions
        const validTopics = allLines.filter(line => {
            // Exclude lines starting with emoji-like characters or specific symbols
            // Common emojis range (simplified check) or check for specific known headers
            const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(line);
            const isInstruction = line.startsWith('(') || line.startsWith('[');
            return !hasEmoji && !isInstruction;
        });

        // Shuffle and pick 10 (or all if less than 10)
        const shuffled = validTopics.sort(() => 0.5 - Math.random());
        const selectedTopics = shuffled.slice(0, 10);

        return NextResponse.json({ topics: selectedTopics });

    } catch (error) {
        console.error('Topic suggestion error:', error);
        return NextResponse.json({
            topics: ["Motivation", "Discipline", "Success", "Stoicism", "Wisdom"]
        });
    }
}

