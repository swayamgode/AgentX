import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-util';

export async function POST(req: NextRequest) {
    let topic = '';
    let count = 10;

    try {
        const body = await req.json();
        topic = body.topic;
        count = body.count || 10;
        const style = body.style || 'inspirational';
        const customGeminiKey: string | undefined = body.geminiApiKey; // per-group key override

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        const { keyManager } = await import('@/lib/key-manager');
        const { GoogleGenerativeAI } = await import('@google/generative-ai');

        let quotes: any[] = [];
        let responseText = '';
        let lastError = null;

        // --- Key resolution ---
        // If a group-specific key is provided, use it directly (single attempt, no rotation).
        // Otherwise fall back to the shared keyManager rotation.
        const useDirectKey = !!customGeminiKey;
        const MAX_RETRIES = useDirectKey ? 1 : 3;

        // --- Retry Loop for API Key Rotation ---
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            const apiKey = useDirectKey ? customGeminiKey! : keyManager.getNextKey();
            if (!apiKey) {
                lastError = new Error('No Gemini API keys available');
                break;
            }

            try {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

                const stylePrompts = {
                    inspirational: 'inspirational and motivational',
                    funny: 'funny and humorous',
                    wisdom: 'wise and thought-provoking',
                    success: 'success and achievement focused'
                };

                const prompt = `Role: Expert Content Strategist. Generate ${count} viral quotes about "${topic}". Style: ${stylePrompts[body.style as keyof typeof stylePrompts] || 'inspirational'}. Output ONLY JSON array: [{"text": "...", "author": "...", "category": "..."}]`;

                const result = await model.generateContent(prompt);
                
                if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
                    throw new Error('Gemini API returned no candidates (possible safety block)');
                }

                // Safely get text
                try {
                    responseText = result.response.text();
                } catch (textErr) {
                    console.error('[Quotes] Could not get text from response (possible safety block):', textErr);
                    throw new Error('Gemini API response blocked by safety filters');
                }
                
                if (!responseText) {
                    throw new Error('Gemini API returned empty response text');
                }

                // If we got here, it succeeded!
                lastError = null;
                break;
            } catch (err: any) {
                lastError = err;
                const errMsg = err.message || '';
                
                // If Quota Error (429), mark the key as failed and try next one
                if (errMsg.includes('429') || errMsg.includes('quota')) {
                    if (!useDirectKey) keyManager.markKeyFailed(apiKey);
                    console.log(`[Quotes] Attempt ${attempt} failed with Quota Error. ${useDirectKey ? 'Group key quota hit.' : 'Retrying with next key...'}`);
                    continue; 
                }

                // If Invalid/Expired Key (400), mark the key as permanently invalid and try next one
                if (errMsg.includes('400') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('expired')) {
                    if (!useDirectKey) keyManager.markKeyInvalid(apiKey);
                    console.log(`[Quotes] Attempt ${attempt} failed with Invalid Key. ${useDirectKey ? 'Check group Gemini key.' : 'Retrying with next key...'}`);
                    continue;
                }
                
                console.error(`[Quotes] Attempt ${attempt} failed:`, errMsg);
                // If other error, just break and use fallback
                break;
            }
        }

        if (lastError && !responseText) {
            console.error('All quote generation attempts failed:', lastError);
            const fallbackQuotes = generateFallbackQuotes(topic, count);
            console.log(`[Quotes] Returning ${fallbackQuotes.length} fallback quotes.`);
            return NextResponse.json({ quotes: fallbackQuotes });
        }

        // --- Parsing AI response ---
        try {
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/\[[\s\S]*\]/);
            const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
            const cleanJson = jsonText.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}').trim();
            quotes = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error('[Quotes] JSON parse failed, returning fallbacks. Error:', parseError);
            quotes = generateFallbackQuotes(topic, count);
        }

        let validQuotes = Array.isArray(quotes) 
            ? quotes.filter((q: any) => q && q.text && q.author).slice(0, count)
            : [];

        if (validQuotes.length === 0) {
           console.log('[Quotes] No valid quotes after filtering, using fallbacks.');
           validQuotes = generateFallbackQuotes(topic, count);
        }

        return NextResponse.json({ quotes: validQuotes });

    } catch (error: any) {
        console.error('Unexpected Quote generation error:', error);
        return NextResponse.json({ quotes: generateFallbackQuotes(topic || 'Determination', count) });
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
