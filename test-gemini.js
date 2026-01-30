const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), ".env.local");
        const envFile = fs.readFileSync(envPath, "utf8");
        const lines = envFile.split("\n");
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
            }
        }
    } catch (e) {
        console.error("Could not read .env.local", e);
    }
}

loadEnv();

async function test() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("No GOOGLE_API_KEY found.");
        return;
    }
    console.log("Found API Key:", apiKey.substring(0, 5) + "...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say hello!");
        console.log("Success! Response:", result.response.text());
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
