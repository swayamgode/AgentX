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

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', errorData);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Gemini API response:', JSON.stringify(data, null, 2));

        // Check if response has expected structure
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Unexpected API response structure:', data);
            throw new Error('Invalid API response structure');
        }

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

        // If rate limited, use mock data for testing
        if (error instanceof Error && error.message.includes('429')) {
            console.log('Rate limited - using mock data for testing');
            return generateMockMemes(topic, count, includeAudio);
        }

        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to generate memes with AI');
    }
}

/**
 * Generate mock memes for testing when API is rate-limited
 */
function generateMockMemes(topic: string, count: number, includeAudio: boolean): MemeIdea[] {
    const templates = VIDEO_TEMPLATES;
    const audioTracks = AUDIO_LIBRARY.filter(a => a.id !== 'silence');
    const memes: MemeIdea[] = [];

    const topicWords = topic.toLowerCase().split(' ');
    const isWorkRelated = topicWords.some(w => ['work', 'coding', 'programming', 'developer', 'bug', 'office'].includes(w));
    const isMondayRelated = topicWords.includes('monday');

    for (let i = 0; i < count; i++) {
        // Select template based on index
        const template = templates[i % templates.length];

        // Select audio
        const audio = includeAudio && audioTracks.length > 0
            ? audioTracks[i % audioTracks.length]
            : null;

        // Generate text based on template and topic
        const textOverlays = template.textOverlays.map((overlay, idx) => {
            let text = '';

            if (isWorkRelated) {
                const workTexts = [
                    'Me at 3 AM debugging',
                    'Production on Friday',
                    'When the code works first try',
                    'My code vs the bug',
                    'Deploying to production',
                    'Code review be like',
                    'Stack Overflow saving me again',
                    'When git merge conflicts',
                ];
                text = workTexts[i % workTexts.length];
            } else if (isMondayRelated) {
                const mondayTexts = [
                    'Monday morning alarm',
                    'Me on Monday',
                    'Weekend vs Monday',
                    'Monday motivation',
                    'Coffee on Monday',
                    'Monday meetings',
                    'Sunday night vs Monday morning',
                    'Monday mood',
                ];
                text = mondayTexts[i % mondayTexts.length];
            } else {
                text = `${topic} - Part ${idx + 1}`;
            }

            return {
                id: overlay.id,
                text,
            };
        });

        // Generate title
        const title = `${textOverlays[0].text} 😂 #${i + 1}`;

        // Generate description
        const description = `Relatable ${topic} meme! Follow for more 🔥`;

        // Generate tags
        const baseTags = ['meme', 'funny', 'relatable', 'viral'];
        const topicTags = topicWords.filter(w => w.length > 3);
        const tags = [...baseTags, ...topicTags, template.category].slice(0, 8);

        memes.push({
            templateId: template.id,
            audioId: audio?.id || null,
            textOverlays,
            title,
            description,
            tags,
        });
    }

    return memes;
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
