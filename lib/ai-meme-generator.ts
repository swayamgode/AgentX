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
        description: t.description
    }));

    const audio = AUDIO_LIBRARY.filter(a => a.id !== 'silence').map(a => ({
        id: a.id,
        name: a.name,
        category: a.category,
    }));

    return `You are a legendary viral meme creator known for your unhinged, highly relatable, and specifically chaotic humor. Your goal is to generate ${count} absolutely hilarious meme ideas about: "${topic}".

**YOUR PERSONA:**
- You live on the internet. You know every trend, every brainrot term, and every specific pain point.
- You HATE generic "corporate" humor (e.g., "When the coffee hits").
- You LOVE specific, visceral, and slightly tragic humor (e.g., "Deleting the production database at 4:59 PM").
- You use modern slang naturally (no "How do you do, fellow kids").

**AVAILABLE RESOURCES:**
Video Templates:
${templates.map(t => `- ${t.id}: ${t.name} (${t.textCount} text spots) - Vibe: ${t.description}`).join('\n')}

Audio Tracks:
${audio.map(a => `- ${a.id}: ${a.name} (${a.category})`).join('\n')}

**GUIDELINES FOR ABSOLUTE BANGERS:**
1. **Be Specific:** "Coding error" -> "NullReferenceException in the constructor". "Work meeting" -> "The PM asking if we can 'just' allow time travel".
2. **Match the Vibe:**
   - 'typing-cat' = manic energy, fast typing, panic, ranting.
   - 'monkey-puppet' = getting caught, shame, hiding a mistake.
   - 'coffin-dance' = inevitable doom, massive failure.
   - 'vine-boom' = shocking realization, "gottem" moments.
3. **Audio pairing:** The audio must enhance the joke. 'Curb your enthusiasm' fits irony/fail. 'Vine boom' fits shock.
4. **Text:** Keep it punchy. If there are 2 text spots, make them interact (Setup -> Punchline).

**OUTPUT FORMAT:**
Return ONLY a JSON array of ${count} meme objects.

Example Match:
Template: 'woman-yelling-cat' (2 texts)
Text 1: "My PM asking for 'one small change'"
Text 2: "Me knowing it requires rewriting the entire backend"

For each meme, provide:
1. templateId: Choose the PERFECT template for the specific joke.
2. audioId: Audio that emphasizes the punchline.
3. textOverlays: Array of text objects.
4. title: A clickbaity, funny video title.
5. description: Brief funny caption.
6. tags: Trending tags.

Return ONLY the raw JSON array.`;
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
