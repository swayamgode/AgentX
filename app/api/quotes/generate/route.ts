import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { topic, count = 10, style = 'inspirational' } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
        }

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

        const stylePrompts = {
            inspirational: 'inspirational and motivational',
            funny: 'funny and humorous',
            wisdom: 'wise and thought-provoking',
            success: 'success and achievement focused'
        };

        const prompt = `Generate ${count} ${stylePrompts[style as keyof typeof stylePrompts] || 'inspirational'} quotes about "${topic}".

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
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\[[\s\S]*\]/);
            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
            quotes = JSON.parse(jsonText.trim());
        } catch (parseError) {
            console.error("Failed to parse AI response, using fallback");
            quotes = generateFallbackQuotes(topic, count);
        }

        const validQuotes = quotes
            .filter((q: any) => q.text && q.author)
            .slice(0, count);

        return NextResponse.json({ quotes: validQuotes });

    } catch (error: any) {
        console.error('Quote generation error:', error);
        const { topic, count = 10 } = await req.json();
        return NextResponse.json({
            quotes: generateFallbackQuotes(topic, count)
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
