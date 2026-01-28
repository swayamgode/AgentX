
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MEME_TEMPLATES } from "@/lib/memes";
import { analyticsStorage } from "@/lib/analytics-storage";

// Ensure API Key exists
const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            console.error("Missing GOOGLE_API_KEY");
            return new Response(JSON.stringify({ error: "Server configuration error: Missing API Key" }), { status: 500 });
        }

        const { topic, count = 10, templateId } = await req.json();

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // Select templates
        const templatesToUse: any[] = [];
        if (templateId) {
            const selectedTemplate = MEME_TEMPLATES.find(t => t.id === templateId);
            if (selectedTemplate) {
                // Use the selected template for all items
                for (let i = 0; i < count; i++) {
                    templatesToUse.push(selectedTemplate);
                }
            } else {
                // Fallback if template not found
                for (let i = 0; i < count; i++) {
                    templatesToUse.push(MEME_TEMPLATES[i % MEME_TEMPLATES.length]);
                }
            }
        } else {
            // Default cyclic behavior
            for (let i = 0; i < count; i++) {
                templatesToUse.push(MEME_TEMPLATES[i % MEME_TEMPLATES.length]);
            }
        }

        // Get high performing memes for context
        const topMemes = analyticsStorage.getTopPerforming(3);
        const performanceContext = topMemes.length > 0
            ? `\n\n### SUCCESSFUL MEMES (Replicate their energy):\n${topMemes.map(m => `- Topic: ${m.topic} | Text: ${JSON.stringify(m.texts)}`).join('\n')}\n`
            : "";

        const prompt = `
      You are a world-class meme creator for 2026. Your goal is to create viral, "Gen Z" style, and "Shorts-ready" memes.
      
      Topic: "${topic}"
      Current Date: ${new Date().toLocaleDateString()}
      Trends to consider: "365 buttons", "delulu", "gym resolutions", "POV", "Me vs. Guy she tells you not to worry about".
      ${performanceContext}

      Generate ${count} distinct meme ideas based on this topic.
      I will provide a list of Template IDs to use for each meme.
      
      Templates required:
      ${templatesToUse.map((t, i) => `${i}. ID: ${t.id} (Requires ${t.boxCount} text fields)`).join("\n")}

      Return strictly a JSON array of objects. Do not include markdown code blocks.
      Each object must have:
      - "index": number (matching the index above)
      - "templateId": string
      - "texts": string[] (Array of strings matching the required boxCount. Keep them EXTREMELY SHORT. Max 5 words per text box. NO complex sentences. Use ALL CAPS for classic memes.)

      Example JSON Structure:
      [
        { "index": 0, "templateId": "drake", "texts": ["WRITING UNIT TESTS", "PUSHING TO PROD ON FRIDAY"] }
      ]
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        console.log("AI Raw Response:", responseText);

        // Clean up markdown - more robustly
        let jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        // Allow for potential leading text before [
        const firstBracket = jsonString.indexOf("[");
        const lastBracket = jsonString.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1) {
            jsonString = jsonString.substring(firstBracket, lastBracket + 1);
        }

        let generatedMemes;
        try {
            generatedMemes = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON", jsonString);
            return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: jsonString }), { status: 500 });
        }

        return new Response(JSON.stringify({ memes: generatedMemes }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("API Error:", error);
        return new Response(JSON.stringify({ error: "Generation failed" }), { status: 500 });
    }
}
