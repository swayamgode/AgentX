import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { decrypt } from "@/lib/encryption";
// import { v4 as uuidv4 } from 'uuid'; // Removed as we use crypto

// Helper to generate UUID if package not available, but crypto is standard in Node
function generateId() {
    return crypto.randomUUID();
}

// Helper function to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(req: Request) {
    try {
        const { topic, vibe, count = 30 } = await req.json();

        // Try to get API key from database first, fallback to env
        let apiKey = "";
        let source = "ENV";

        try {
            const { data: dbApiKey } = await supabase
                .from('ApiKey')
                .select('*')
                .eq('service', 'gemini')
                .eq('isActive', true)
                .single();

            if (dbApiKey) {
                apiKey = decrypt(dbApiKey.key);
                source = "DB";
            }
        } catch (error) {
            console.log("No API key in database, using env fallback");
        }

        // Fallback to environment variable
        if (!apiKey) {
            apiKey = process.env.GOOGLE_API_KEY || "";
            apiKey = apiKey.trim().replace(/^"|"$/g, '');
        }

        if (!apiKey) {
            return NextResponse.json({
                error: "Gemini API Key not configured. Please add it in Settings."
            }, { status: 500 });
        }

        console.log(`Using API Key starting with: ${apiKey.substring(0, 5)}... Source: ${source}`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Generate tweets in batches of 5 to respect rate limits
        const batchSize = 5;
        const numBatches = Math.ceil(count / batchSize);
        let allTweets: string[] = [];

        console.log(`Generating ${count} tweets in ${numBatches} batches...`);

        let lastError = "";

        // Helper to generate content with retry logic
        const generateWithRetry = async (model: any, prompt: string, maxRetries = 3): Promise<string> => {
            let attempt = 0;
            while (attempt <= maxRetries) {
                try {
                    const result = await model.generateContent(prompt);
                    return result.response.text();
                } catch (error: any) {
                    attempt++;

                    // Check for 429 or quota exceeded errors
                    const isRateLimit = error.status === 429 ||
                        (error.message && error.message.includes('429')) ||
                        (error.message && error.message.includes('Quota exceeded'));

                    if (isRateLimit && attempt <= maxRetries) {
                        // Extract retry delay from error if available, or use exponential backoff
                        // Start with 10s, then 20s, 40s etc.
                        let waitTime = 10000 * Math.pow(2, attempt - 1);

                        // Try to parse specific retry delay from error message (e.g. "Please retry in 34s")
                        const delayMatch = error.message?.match(/retry in (\d+)/);
                        if (delayMatch && delayMatch[1]) {
                            waitTime = (parseInt(delayMatch[1]) + 2) * 1000; // Add 2s buffer
                        }

                        console.log(`Rate limit hit (Attempt ${attempt}/${maxRetries}). Waiting ${waitTime / 1000}s before retry...`);
                        await sleep(waitTime);
                        continue;
                    }

                    // If not rate limit or retries exhausted, throw
                    throw error;
                }
            }
            throw new Error("Max retries exceeded");
        };

        for (let i = 0; i < numBatches; i++) {
            const tweetsInBatch = Math.min(batchSize, count - (i * batchSize));

            const prompt = `Generate ${tweetsInBatch} unique, engaging Twitter posts about "${topic}". 
The vibe should be: ${vibe || "professional yet approachable"}.
Each tweet must be within 280 characters. 
Return ONLY a valid JSON array of strings, nothing else.
Example format: ["tweet 1", "tweet 2", "tweet 3"]`;

            try {
                // Use the retry helper
                const responseText = await generateWithRetry(model, prompt);

                // Parse the response
                let jsonStr = responseText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
                const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    jsonStr = arrayMatch[0];
                }

                const tweets = JSON.parse(jsonStr);
                if (Array.isArray(tweets)) {
                    const validTweets = tweets.filter(t => typeof t === 'string' && t.trim().length > 0);
                    allTweets.push(...validTweets);
                }

                // Wait between successful batches to be polite to the API
                // Increased from 4s to 12s to allow bucket to refill slightly
                if (i < numBatches - 1) {
                    console.log(`Batch ${i + 1}/${numBatches} done. Waiting 12s...`);
                    await sleep(12000);
                }
            } catch (batchError: any) {
                console.error(`Error in batch ${i + 1}:`, batchError);
                lastError = batchError.message || String(batchError);
            }
        }

        if (allTweets.length === 0) {
            return NextResponse.json({
                error: `Failed to generate any tweets. Last Error: ${lastError}`
            }, { status: 500 });
        }

        console.log(`Successfully generated ${allTweets.length} tweets`);

        const now = new Date();
        const tweetsToInsert = allTweets.map((content, i) => {
            const scheduledDate = new Date(now);
            scheduledDate.setDate(now.getDate() + i + 1);
            scheduledDate.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60), 0, 0);

            return {
                id: generateId(),
                content,
                scheduledFor: scheduledDate.toISOString(),
                status: 'PENDING_APPROVAL',
                updatedAt: new Date().toISOString()
            };
        });

        // Batch insert using Supabase
        const { data: createdTweets, error } = await supabase
            .from('Tweet')
            .insert(tweetsToInsert)
            .select();

        if (error) {
            console.error("Supabase insert error:", error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            count: createdTweets?.length || 0,
            tweets: createdTweets
        });
    } catch (error) {
        console.error("Bulk generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate bulk tweets. Please try again." },
            { status: 500 }
        );
    }
}
