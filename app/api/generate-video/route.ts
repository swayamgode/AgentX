import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { decrypt } from "@/lib/encryption";

export async function POST(req: Request) {
    try {
        const { topic, vibe } = await req.json();

        // Try to get API key from database first, fallback to env
        let apiKey = "";
        try {
            const { data: dbApiKey } = await supabase
                .from('ApiKey')
                .select('*')
                .eq('service', 'gemini')
                .eq('isActive', true)
                .single();

            if (dbApiKey) {
                apiKey = decrypt(dbApiKey.key);
            }
        } catch (error) {
            console.log("No API key in database, using env fallback");
        }

        if (!apiKey) {
            apiKey = process.env.GOOGLE_API_KEY || "";
            apiKey = apiKey.trim().replace(/^"|"$/g, '');
        }

        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API Key not configured. Please add it in Settings." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using the best available Flash model as requested (approximating user's "2.5" request)
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Create a high-end, professionally designed, fully animated HTML/CSS Vertical Video (Reel/TikTok format).
    Topic: "${topic}"
    Vibe: ${vibe || "modern, clean, viral"}

    ### CRITICAL DESIGN RULES (Strict Compliance Required):
    1.  **Responsive Container**: The main container MUST translate to \`width: 100%; height: 100%; overflow: hidden; position: relative;\`. DO NOT USE FIXED PIXELS (e.g., 1080px) for container dimensions.
    2.  **Units**: Use \`%\`, \`vw\`, \`vh\`, or \`clamp()\` for all sizes. Ensure text scales correctly within a small container (preview) vs full screen.
    3.  **Background**: Use sophisticated animated gradients (mesh), abstract 3D shapes, or a dark cinematic theme.
    4.  **Typography**: Modern sans-serif (Inter, Roboto). Text MUST be readable, centered, and have adequate padding (5%). Use bold titles.
    5.  **Safe Zones**: Keep content within the center 70% of the screen. Leave top/bottom 15% empty.
    6.  **Animations**: Entrance (slide-up/fade), Loop (gradient shift), Emphasis (glow).
    7.  **Format**: Return VALID HTML string with INLINE STYLES or <style>. NO <html>/<body> tags.

    ### EXAMPLE OUTPUT STRUCTURE (JSON):
    {
       "html": "<div style='width:100%; height:100%; background:linear-gradient(...); display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; color:white; font-family:sans-serif;'> <style> @keyframes move { ... } </style> <h1 style='font-size: 8vw; margin-bottom: 2vh;'>TITLE</h1> <p style='font-size: 4vw; padding: 0 5%;'>Text...</p> </div>"
    }

    Return ONLY the JSON object.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();

        // Clean up potential markdown code blocks if the model adds them
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const videoData = JSON.parse(text);

        return NextResponse.json({ video: videoData });
    } catch (error) {
        console.error("Generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate video concept" },
            { status: 500 }
        );
    }
}
