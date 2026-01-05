/**
 * AI Meme Generator
 * Generates meme ideas and configurations using AI
 */

import { VideoTemplate, VIDEO_TEMPLATES } from './video-templates';
import { AudioTrack, AUDIO_LIBRARY } from './audio-library';

export interface MemeIdea {
    templateId: string;
    audioId: string | null;
    textOverlays: {
        id: string;
        text: string;
    }[];
    title: string;
    description: string;
    tags: string[];
}

export interface BulkGenerationOptions {
    topic: string;
    count: number;
    includeAudio?: boolean;
    templatePreference?: 'trending' | 'random' | 'all';
}

/**
 * Generate AI prompt for meme ideas
 */
function createMemePrompt(topic: string, count: number): string {
    const templates = VIDEO_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        category: t.category,
        textCount: t.textOverlays.length,
    }));

    const audio = AUDIO_LIBRARY.filter(a => a.id !== 'silence').map(a => ({
        id: a.id,
        name: a.name,
        category: a.category,
    }));

    return `You are a viral meme creator. Generate ${count} hilarious and relatable meme ideas about: "${topic}"

Available Video Templates:
${templates.map(t => `- ${t.id}: ${t.name} (${t.textCount} text overlays)`).join('\n')}

Available Audio Tracks:
${audio.map(a => `- ${a.id}: ${a.name} (${a.category})`).join('\n')}

For each meme, provide:
1. templateId: Choose the most fitting template
2. audioId: Choose matching audio (or null for silent)
3. textOverlays: Array of text for each overlay position
4. title: Catchy YouTube title (50-60 chars)
5. description: Engaging description (100-150 chars)
6. tags: 5-8 relevant tags

Make the memes:
- Relatable and funny
- Use current internet humor
- Match template context
- Pair audio that enhances the joke
- Vary templates and audio for diversity

Return ONLY a JSON array of ${count} meme objects. No markdown, no explanation.

Example format:
[
  {
    "templateId": "typing-cat",
    "audioId": "vine-boom",
    "textOverlays": [
      {"id": "top-text", "text": "Me writing code at 3 AM"}
    ],
    "title": "Coding at 3 AM be like... 😂",
    "description": "Every developer knows this feeling! Late night coding sessions hit different 💻",
    "tags": ["coding", "programming", "developer", "relatable", "funny", "meme", "tech"]
  }
]`;
}

/**
 * Generate bulk meme ideas using AI
 */
export async function generateBulkMemes(
    options: BulkGenerationOptions,
    apiKey: string
): Promise<MemeIdea[]> {
    const { topic, count, includeAudio = true, templatePreference = 'all' } = options;

    const prompt = createMemePrompt(topic, count);

    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                },
            }),
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // Clean up response
        let jsonText = text.trim();
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        // Find JSON array
        const startIdx = jsonText.indexOf('[');
        const endIdx = jsonText.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) {
            jsonText = jsonText.substring(startIdx, endIdx + 1);
        }

        const memes: MemeIdea[] = JSON.parse(jsonText);

        // Validate and filter
        const validMemes = memes.filter(meme => {
            const template = VIDEO_TEMPLATES.find(t => t.id === meme.templateId);
            return template && meme.textOverlays.length === template.textOverlays.length;
        });

        // If not including audio, set all to null
        if (!includeAudio) {
            validMemes.forEach(meme => {
                meme.audioId = null;
            });
        }

        return validMemes.slice(0, count);
    } catch (error) {
        console.error('AI generation failed:', error);
        throw new Error('Failed to generate memes with AI');
    }
}

/**
 * Generate meme configuration from idea
 */
export function createMemeConfig(idea: MemeIdea) {
    const template = VIDEO_TEMPLATES.find(t => t.id === idea.templateId);
    const audio = idea.audioId ? AUDIO_LIBRARY.find(a => a.id === idea.audioId) : null;

    if (!template) {
        throw new Error(`Template ${idea.templateId} not found`);
    }

    // Map text overlays
    const textOverlays = template.textOverlays.map((overlay, index) => {
        const ideaText = idea.textOverlays[index];
        return {
            ...overlay,
            text: ideaText?.text || overlay.text,
        };
    });

    return {
        template,
        audio: audio || null,
        textOverlays,
        metadata: {
            title: idea.title,
            description: idea.description,
            tags: idea.tags,
        },
    };
}
