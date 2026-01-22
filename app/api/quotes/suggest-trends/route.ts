import { NextResponse } from 'next/server';

export async function POST() { // Removed req parameter as it's not currently used
    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
        }

        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `Suggest 10 currently trending, viral, or evergreen topics for YouTube Shorts quotes videos. 
        Focus on niches that get high engagement (e.g., Stoicism, Dark Psychology, Financial Freedom, Self-Discipline, Heartbreak, Sigma Mindset).
        
        Return ONLY a JSON array of strings, for example:
        ["Stoicism", "Self Discipline", "Financial Freedom"]`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let topics = [];
        try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            const jsonText = jsonMatch ? jsonMatch[0] : responseText;
            topics = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse AI topics:", responseText);
            topics = ["Motivation", "Discipline", "Success", "Stoicism", "Wisdom"];
        }

        return NextResponse.json({ topics });

    } catch (error) {
        console.error('Topic suggestion error:', error);
        return NextResponse.json({
            topics: ["Motivation", "Discipline", "Success", "Stoicism", "Wisdom"]
        });
    }
}
