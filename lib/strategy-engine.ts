import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyticsStorage, VideoAnalyticsData } from './analytics-storage';

// Types for our "Model" output
interface StrategyInsight {
    topTopics: string[];
    avgViewsByTopic: Record<string, number>;
    optimalTitleLength: number;
    bestPerformingKeywords: string[];
}

interface VideoSuggestion {
    title: string;
    topic: string;
    reasoning: string;
    predictedPerformance: 'High' | 'Medium' | 'Low';
}

export class StrategyEngine {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    /**
     * "Trains" a local statistical model on the current data to find patterns.
     */
    private analyzePatterns(data: VideoAnalyticsData[]): StrategyInsight {
        const topicStats: Record<string, { totalViews: number; count: number }> = {};
        const titleWords: Record<string, number> = {};
        let totalTitleLength = 0;

        data.forEach(video => {
            const views = parseInt(video.stats?.viewCount || '0');
            const topic = video.topic || 'uncategorized';

            // Topic analysis
            if (!topicStats[topic]) topicStats[topic] = { totalViews: 0, count: 0 };
            topicStats[topic].totalViews += views;
            topicStats[topic].count += 1;

            // Title Length
            totalTitleLength += video.title.length;

            // Keyword analysis (simple bag of words)
            const words = video.title.toLowerCase().split(/\s+/);
            words.forEach(w => {
                if (w.length > 3) { // skip common small words
                    titleWords[w] = (titleWords[w] || 0) + views; // Weighted by views
                }
            });
        });

        // Compute Averages
        const avgViewsByTopic: Record<string, number> = {};
        Object.keys(topicStats).forEach(t => {
            const stats = topicStats[t];
            avgViewsByTopic[t] = Math.round(stats.totalViews / stats.count);
        });

        // Sort Top Topics
        const topTopics = Object.entries(avgViewsByTopic)
            .sort(([, a], [, b]) => b - a)
            .map(([topic]) => topic)
            .slice(0, 3);

        // Sort Best Keywords
        const bestKeywords = Object.entries(titleWords)
            .sort(([, a], [, b]) => b - a)
            .map(([word]) => word)
            .slice(0, 10);

        return {
            topTopics,
            avgViewsByTopic,
            optimalTitleLength: data.length ? Math.round(totalTitleLength / data.length) : 0,
            bestPerformingKeywords: bestKeywords
        };
    }

    /**
     * Uses the LLM + Local Insights to generate suggestions.
     * This effectively "RAGs" the analytics data into the prompt.
     */
    async generateSuggestions(): Promise<VideoSuggestion[]> {
        const allData = analyticsStorage.getAll();

        if (allData.length === 0) {
            throw new Error("No analytics data available to train on.");
        }

        // 1. Run local "training"
        const insights = this.analyzePatterns(allData);

        // 2. Identify top 5 videos for context
        const topVideos = [...allData]
            .sort((a, b) => parseInt(b.stats?.viewCount || '0') - parseInt(a.stats?.viewCount || '0'))
            .slice(0, 5)
            .map(v => `"${v.title}" (${v.topic}) - ${v.stats?.viewCount} views`);

        // 3. Construct the Prompt
        const prompt = `
            Act as a YouTube Strategy AI. I have analyzed my channel's performance and here are the insights:

            STATISTICAL INSIGHTS:
            - Best performing topics: ${insights.topTopics.join(', ')}
            - Best performing keywords: ${insights.bestPerformingKeywords.join(', ')}
            - Average Title Length: ${insights.optimalTitleLength} chars

            TOP 5 VIDEOS (Historical Data):
            ${topVideos.join('\n')}

            TASK:
            Based on this "training" data, generate 5 specific video ideas that are statistically likely to perform well.
            For each idea, provide the Title, Topic, and a brief Reasoning explaining why it fits the winning pattern.
            
            Return the response in raw JSON format (an array of objects with title, topic, reasoning, predictedPerformance).
            Do not include markdown formatting like \`\`\`json.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text().replace(/```json|```/g, '').trim();

            return JSON.parse(text) as VideoSuggestion[];
        } catch (error) {
            console.error("Strategy Generation Failed:", error);
            // Fallback if LLM fails
            return insights.topTopics.map(topic => ({
                title: `More content about ${topic}`,
                topic: topic,
                reasoning: "Based on historical topic performance.",
                predictedPerformance: "Medium"
            }));
        }
    }
}
