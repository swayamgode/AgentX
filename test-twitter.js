const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const path = require("path");

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), ".env.local");
        const envFile = fs.readFileSync(envPath, "utf8");
        const lines = envFile.split("\n");
        for (const line of lines) {
            // Remove BOM and whitespace
            const cleanLine = line.trim().replace(/^\uFEFF/, '');
            const match = cleanLine.match(/^([^=]+)=(.*)$/);
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
    const appKey = process.env.TWITTER_APP_KEY;
    const appSecret = process.env.TWITTER_APP_SECRET;
    const accessToken = process.env.TWITTER_ACCESS_TOKEN;
    const accessSecret = process.env.TWITTER_ACCESS_SECRET;

    console.log("Environment check:");
    console.log("TWITTER_APP_KEY:", appKey ? "Found" : "Missing");
    console.log("TWITTER_APP_SECRET:", appSecret ? "Found" : "Missing");
    console.log("TWITTER_ACCESS_TOKEN:", accessToken ? "Found" : "Missing");
    console.log("TWITTER_ACCESS_SECRET:", accessSecret ? "Found" : "Missing");

    if (!appKey || !appSecret || !accessToken || !accessSecret) {
        console.error("Missing Twitter Credentials in .env.local");
        return;
    }

    console.log("Testing Twitter Connection...");
    console.log(`Key: ${appKey.substring(0, 2)}...`);

    const client = new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
    });

    try {
        // Attempt to check credentials first
        const currentUser = await client.v2.me();
        console.log("Authenticated as:", currentUser.data.username);

        // Attempt to post
        const tweet = await client.v2.tweet(`Test tweet from AgentX debugging at ${new Date().toISOString()}`);
        console.log("Tweet posted successfully!", tweet);
    } catch (error) {
        console.error("Twitter Error Details:", JSON.stringify(error, null, 2));
        if (error.data) {
            console.error("API Error Data:", JSON.stringify(error.data, null, 2));
        }
    }
}

test();
