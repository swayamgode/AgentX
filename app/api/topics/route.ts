import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
    try {
        const topicsPath = path.join(process.cwd(), 'topics.txt');

        if (!fs.existsSync(topicsPath)) {
            return NextResponse.json({ topics: [] });
        }

        const fileContent = fs.readFileSync(topicsPath, 'utf-8');

        // Parse topics: split by newlines, filter out empty lines and headers/instructions
        const topics = fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => {
                // Filter out empty lines
                if (!line) return false;
                // Filter out headers/categories (often have emojis or parentheses)
                // Heuristic: line starts with an emoji or '(' usually indicates a category or note, 
                // BUT user might want emoji topics. 
                // Looking at the file: 
                // "1: 🌼 Nature & Growth" - these are headers in my view, but maybe topics?
                // The lines like "Blooming despite storms" are clearly topics.
                // Headers seem to have emojis at the start OR be inside ()

                // Let's filter out lines that end with specific known headers or just assume non-indented? 
                // The file has blank lines between topics.
                // Headers: "🌼 Nature & Growth", "🌷 Self-Love...", "(Perfect for hero sections...)"
                // Topics: "Blooming despite storms"

                // Heuristic: If it has an emoji at the start, it's likely a category header in this specific file format.
                if (/^[\(\[\{]/.test(line)) return false; // Starts with (
                // Identify emojis? A bit hard with regex, but we can look for the specific structure.
                // The headers in the file seem to be the only ones with emojis at the START.
                // "Blooming despite storms" has no emoji.
                // Let's filter out lines with emojis at position 0-2?
                // Or maybe just filter out lines that look like "Header".

                // Better approach based on file content observation:
                // Headers have emojis. Topics do not.
                // One exception: "73: 🌼 Minimal / One-Line Website Quotes"

                // Let's try to filter lines that have emojis.
                if (/\p{Extended_Pictographic}/u.test(line)) return false;

                return true;
            });

        return NextResponse.json({ topics });
    } catch (error) {
        console.error('Failed to read topics:', error);
        return NextResponse.json({ error: 'Failed to read topics' }, { status: 500 });
    }
}
