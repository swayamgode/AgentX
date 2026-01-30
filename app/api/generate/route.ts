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

    // Fallback to environment variable
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-exp" });

    const prompt = `Generate a catchy, engaging Twitter post about "${topic}". 
    The vibe should be: ${vibe || "professional yet approachable"}.
    Keep it within 280 characters. 
    Do not include hashtags unless necessary. 
    Return ONLY the tweet text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ tweet: text });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate tweet" },
      { status: 500 }
    );
  }
}
