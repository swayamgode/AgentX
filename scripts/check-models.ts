import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function listModels() {
    const report: string[] = [];

    let apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        report.push('Error: No GOOGLE_API_KEY in .env.local');
        fs.writeFileSync('models-report.txt', report.join('\n'));
        return;
    }

    apiKey = apiKey.trim().replace(/^"|"$/g, '');

    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTest = [
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-latest",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    report.push(`Testing Key: ${apiKey.substring(0, 8)}...`);

    for (const modelName of modelsToTest) {
        try {
            report.push(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            report.push(`✅ ${modelName} WORKED!`);
        } catch (error: any) {
            report.push(`❌ ${modelName} Failed: ${error.message.split('\n')[0]}`);
        }
    }

    fs.writeFileSync('models-report.txt', report.join('\n'));
    console.log("Done. Check models-report.txt");
}

listModels();
