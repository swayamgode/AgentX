import { NextRequest, NextResponse } from 'next/server';
import { analyticsStorage } from '@/lib/analytics-storage';
import { getAuthUser } from '@/lib/auth-util';

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
        // Using gemini-2.0-flash as it handles large context windows (like our CSV data) very well
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // --- 1. Prepare Analytics Data (The "XL File") ---
        const user = await getAuthUser();
        const userId = user?.id || 'dev-id-001';
        const allVideos = analyticsStorage.getAll(userId);

        // Filter for meaningful data and limit to recent 50 to avoid token overload
        const relevantData = allVideos
            .filter(v => v.stats && parseInt(v.stats.viewCount) > 0)
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
            .slice(0, 50);

        // Convert to CSV format for the AI to "read"
        // Headers: Topic, Views, Likes, Content
        const csvData = [
            "Topic,Views,Likes,Content_Snippet",
            ...relevantData.map(v => {
                const text = v.texts?.[0]?.substring(0, 50).replace(/,/g, ' ') || "No text";
                return `${v.topic},${v.stats?.viewCount || 0},${v.stats?.likeCount || 0},"${text}"`;
            })
        ].join('\n');

        const stylePrompts = {
            inspirational: 'inspirational and motivational',
            funny: 'funny and humorous',
            wisdom: 'wise and thought-provoking',
            success: 'success and achievement focused'
        };

        const prompt = `
Role: You are an expert Social Media Content Strategist and Data Analyst.
Task: Generate ${count} viral quotes about the topic "${topic}".

Data Source:
I have provided a CSV export of our past video performance below. This is your "Excel File" of analytics.
Use this data to understand what actually works for our audience.

### PERFORMANCE DATA (CSV)
${csvData}
### END DATA

Analysis Instructions:
1. Scan the CSV data. Identify the top performing videos (Highest Views).
2. Look for patterns in the successful content: What tone do they use? How short are they? What keywords appear?
3. Identify low performers: What should be avoided?

Generation Strategy:
- **70% Proven Winners**: Generate quotes that strictly follow the patterns of our highest-performing past content (similar tone, structure, or length).
- **30% Blue Ocean Experiments**: Try something new and "like that" but slightly different. If we usually do serious quotes, try one with a twist. If we usually do short ones, try a slightly longer, rhythmic one.

Topic Focus: ${topic}
Style: ${stylePrompts[style as keyof typeof stylePrompts] || 'inspirational'}

Output Requirements:
Return ONLY a JSON array of objects with this exact structure:
[
  {
    "text": "The quote text",
    "author": "Author name or 'Anonymous'",
    "category": "Specific category (e.g. 'Deep Motivation', 'Dark Psychology', 'Stoic Wisdom')"
  }
]

Make the quotes:
- Concise (under 150 characters)
- Impactful
- Optimized for viral retention (hooks early)
`;

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
