import { NextRequest, NextResponse } from 'next/server';
import { analyticsStorage } from '@/lib/analytics-storage';

export async function POST(req: NextRequest) {
    let topic = '';
    let count = 10;

    try {
        const body = await req.json();
        topic = body.topic;
        count = body.count || 10;
        const style = body.style || 'inspirational';

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
        }

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-2.5-flash as requested
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const stylePrompts = {
            inspirational: 'inspirational and motivational',
            funny: 'funny and humorous',
            wisdom: 'wise and thought-provoking',
            success: 'success and achievement focused'
        };

        // Get high performing videos for context (even if they are distinct from quotes, the "vibe" helps)
        // Ideally we'd filter for "quotes" topic or similar if we differentiated strictly,
        // but generally high performing content is good context.
        const topContent = analyticsStorage.getTopPerforming(3);
        const performanceContext = topContent.length > 0
            ? `\n\n### VIRAL CONTENT EXAMPLES (Replicate their impact):\n${topContent.map(m => `- Topic: ${m.topic} | Text: ${JSON.stringify(m.texts)}`).join('\n')}\n`
            : "";

        const prompt = `Generate ${count} ${stylePrompts[style as keyof typeof stylePrompts] || 'inspirational'} quotes about "${topic}".
        ${performanceContext}

Return ONLY a JSON array of objects with this exact structure:
[
  {
    "text": "The quote text",
    "author": "Author name or 'Anonymous'",
    "category": "Category like 'Motivation', 'Success', 'Life', etc."
  }
]

Make the quotes:
- Concise (under 150 characters)
- Impactful and memorable
- Relevant to the topic
- Varied in perspective

Return ONLY the JSON array, no other text.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log("AI Raw Response:", responseText);

        let quotes;
        try {
            // Clean up regex to be more permissive
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
                responseText.match(/\[[\s\S]*\]/);

            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

            // Clean any trailing commas or markdown artifacts if needed
            const cleanJson = jsonText.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}').trim();

            quotes = JSON.parse(cleanJson);

            if (!Array.isArray(quotes)) {
                throw new Error("Response is not an array");
            }
        } catch (parseError) {
            console.error("Failed to parse AI response, using fallback. Response was:", responseText);
            quotes = generateFallbackQuotes(topic, count);
        }

        const validQuotes = quotes
            .filter((q: any) => q.text && q.author)
            .slice(0, count);

        return NextResponse.json({ quotes: validQuotes });

    } catch (error: any) {
        console.error('Quote generation error:', error);
        // Return fallback quotes if anything fails
        return NextResponse.json({
            quotes: generateFallbackQuotes(topic || 'Determination', count)
        });
    }
}

function generateFallbackQuotes(topic: string, count: number) {
    const fallbacks = [
        { text: `Success in ${topic} comes from persistence.`, author: "Anonymous", category: "Success" },
        { text: `The journey of ${topic} begins with a single step.`, author: "Anonymous", category: "Motivation" },
        { text: `Excellence in ${topic} is not an act, but a habit.`, author: "Aristotle", category: "Excellence" },
        { text: `${topic} is the key to unlocking your potential.`, author: "Anonymous", category: "Growth" },
        { text: `Master ${topic} and you master yourself.`, author: "Anonymous", category: "Mastery" },
    ];

    return fallbacks.slice(0, count);
}
