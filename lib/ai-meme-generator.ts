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

    return `You are a chronically online Gen Z meme lord who lives and breathes internet culture. Your memes go VIRAL because they're absurdly specific, darkly funny, and hit different. Generate ${count} absolutely UNHINGED meme ideas about: "${topic}".

**YOUR VIBE:**
- You're terminally online. You know every trend, every piece of brainrot, every niche reference.
- You speak fluent Gen Z: "no cap", "fr fr", "it's giving", "slay", "ate", "lowkey", "highkey", "deadass", "bruh"
- You HATE corporate cringe humor ("When Monday hits different! ☕😂")
- You LOVE hyper-specific, self-deprecating, absurdist chaos

**TRENDING MEME EXAMPLES (2025-2026):**

1. Template: woman-yelling-cat
   Text 1: "My PM: 'Just add a small feature'"
   Text 2: "Me knowing it requires rewriting the entire authentication system"
   
2. Template: typing-cat
   Text: "Me writing a 47-line comment to explain one line of regex"
   
3. Template: monkey-puppet
   Text: "When the interviewer asks about my '5 years of experience' in a framework from 2023"
   
4. Template: this-is-fine
   Text: "Me deploying to production at 4:59 PM on Friday"
   
5. Template: panik-kalm (3 texts)
   Text 1: "Code not working"
   Text 2: "Found solution on Stack Overflow"
   Text 3: "Solution from 2015"
   
6. Template: typing-cat
   Text: "Me Googling 'how to exit vim' for the 47th time this month"
   
7. Template: they-dont-know
   Text: "They don't know I deployed to prod on Friday"
   
8. Template: distracted-boyfriend (3 texts)
   Text 1 (boyfriend): "Me"
   Text 2 (other girl): "New JS framework"
   Text 3 (girlfriend): "My current project"

**AVAILABLE RESOURCES:**
Video Templates:
${templates.map(t => `- ${t.id}: ${t.name} (${t.textCount} texts) - ${t.description}`).join('\n')}

Audio Tracks:
${audio.map(a => `- ${a.id}: ${a.name} (${a.category})`).join('\n')}

**RULES FOR ABSOLUTE BANGERS:**

1. **BE HYPER-SPECIFIC:**
   ❌ "Coding problems"
   ✅ "NullReferenceException in the constructor at 4:58 PM on deployment day"
   
   ❌ "Work stress"
   ✅ "The PM asking if we can 'just' add time travel to the settings page"

2. **USE GEN Z SLANG NATURALLY:**
   - "no cap fr fr" = for real, no lie
   - "it's giving [vibe]" = it has that energy
   - "ate and left no crumbs" = did perfectly
   - "lowkey/highkey" = somewhat/very much
   - "deadass" = seriously
   - Examples: "Me deadass writing 'no cap fr fr' in my thesis", "This bug is giving 2020 energy"

3. **MATCH TEMPLATE VIBES:**
   - typing-cat = manic panic typing, late night energy, ranting
   - monkey-puppet = getting caught, shame, awkward silence
   - woman-yelling-cat = two opposing forces, ironic contrast
   - this-is-fine = everything is chaos but pretending it's okay
   - panik-kalm = emotional rollercoaster, false hope
   - side-eye-chloe = skepticism, "yeah right" energy
   - bernie-sanders = repetitive requests, begging
   - distracted-boyfriend = temptation, choosing wrong option
   - two-buttons = impossible choice, both bad options
   - expanding-brain = levels of intelligence/stupidity

4. **AUDIO PAIRING:**
   - vine-boom = shocking reveal, "gottem" moment
   - curb-your-enthusiasm = ironic failure, awkward situation
   - oh-no = impending disaster
   - emotional-damage = roast, burn
   - coffin-dance = total failure, death of hopes
   - record-scratch = freeze frame, "you're probably wondering how I got here"

5. **HUMOR STYLES TO USE:**
   - Self-deprecating: "Me calculating if I can afford rent or therapy (I need both)"
   - Absurdist: "Me explaining to my therapist why I need exactly 365 buttons in 2026"
   - Dark: "My mental health in 2026 (it's giving 2020 vibes)"
   - Specific: "Me in the daily standup saying 'no blockers' while everything is on fire"

**OUTPUT FORMAT:**
Return ONLY a raw JSON array of ${count} meme objects. Each meme must have:
- templateId: The PERFECT template for this specific joke
- audioId: Audio that amplifies the punchline (or null)
- textOverlays: Array matching template's text count
- title: Clickbait-y, funny YouTube title
- description: Brief caption with Gen Z energy
- tags: Trending, searchable tags

NO markdown, NO explanation, JUST the JSON array.`;
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
