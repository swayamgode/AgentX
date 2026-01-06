import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { VIDEO_TEMPLATES } from '@/lib/video-templates';

export async function POST(request: NextRequest) {
    try {
        const { topic, count = 6 } = await request.json();

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Build template context for AI
        const templateContext = VIDEO_TEMPLATES.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            category: t.category,
            overlays: t.textOverlays.map(o => ({
                id: o.id,
                position: o.position,
                maxLength: o.position === 'top' || o.position === 'bottom' ? 50 : 30
            }))
        }));

        const prompt = `You are a creative meme generator. Generate ${count} funny and relatable video meme ideas about: "${topic}".

Available video templates:
${JSON.stringify(templateContext, null, 2)}

For each meme:
1. Choose the MOST APPROPRIATE template based on the meme concept
2. Generate text for EACH text overlay in that template
3. Keep text SHORT and PUNCHY (respect maxLength)
4. Make it funny and relatable
5. Use proper capitalization (not all caps unless it's for emphasis)

Return ONLY a JSON array with this exact structure:
[
  {
    "templateId": "template-id-here",
    "textOverlays": [
      {
        "id": "overlay-id-from-template",
        "text": "Your funny text here"
      }
    ]
  }
]

CRITICAL: Return ONLY the JSON array, no markdown formatting, no explanations.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log('Gemini API Response:', text);

        // Parse response
        let memes;
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
            const jsonText = jsonMatch ? jsonMatch[1] : text.trim();
            memes = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse Gemini response:', text);
            // Fallback to mock data
            memes = generateMockVideoMemes(topic, count);
        }

        // Validate and sanitize
        const validMemes = memes
            .filter((m: any) => {
                const template = VIDEO_TEMPLATES.find(t => t.id === m.templateId);
                return template && m.textOverlays && Array.isArray(m.textOverlays);
            })
            .slice(0, count);

        return NextResponse.json({ memes: validMemes });

    } catch (error) {
        console.error('Video meme generation error:', error);

        // Fallback to mock data on error
        const { topic, count = 6 } = await request.json();
        const mockMemes = generateMockVideoMemes(topic, count);

        return NextResponse.json({ memes: mockMemes });
    }
}

// Fallback mock generator
function generateMockVideoMemes(topic: string, count: number) {
    const templates = VIDEO_TEMPLATES.slice(0, count);

    return templates.map(template => {
        const textOverlays = template.textOverlays.map(overlay => {
            let text = '';

            // Generate contextual text based on position and topic
            if (overlay.position === 'top') {
                text = `When ${topic}`;
            } else if (overlay.position === 'bottom') {
                text = `Me dealing with ${topic}`;
            } else {
                text = topic.length > 20 ? topic.substring(0, 20) : topic;
            }

            return {
                id: overlay.id,
                text: text
            };
        });

        return {
            templateId: template.id,
            textOverlays
        };
    });
}
