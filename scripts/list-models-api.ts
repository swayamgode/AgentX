import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkModels() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.log("No API Key found in .env.local");
        return;
    }

    const cleanKey = apiKey.trim().replace(/^"|"$/g, '');
    console.log(`Checking models for key: ${cleanKey.substring(0, 10)}...`);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`);
        const data = await response.json();

        if (data.error) {
            console.error("API returned error:", data.error);
        } else if (data.models) {
            console.log("Available Models:");
            const modelNames = data.models.map((m: any) => m.name.replace('models/', ''));
            console.log(modelNames.join('\n'));

            // Save to file for reading
            fs.writeFileSync('available-models.txt', modelNames.join('\n'));
        } else {
            console.log("No models found in response:", data);
        }
    } catch (e: any) {
        console.error("Fetch error:", e.message);
    }
}

checkModels();
