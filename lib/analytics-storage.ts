import fs from 'fs';
import path from 'path';

const USERS_PATH = path.join(process.cwd(), '.users');

if (!fs.existsSync(USERS_PATH)) {
    fs.mkdirSync(USERS_PATH, { recursive: true });
}

function getUserAnalyticsFile(userId: string) {
    return path.join(USERS_PATH, `${userId}-analytics.json`);
}

const ANALYTICS_FILE = path.join(process.cwd(), '.video-analytics.json');

export interface VideoAnalyticsData {
    youtubeId: string;
    title: string;
    topic: string;
    templateId: string;
    texts: string[];
    thumbnailUrl?: string;
    uploadedAt: string;
    channelId?: string;
    channelName?: string;
    stats?: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
        lastUpdated: string;
    };
}

class AnalyticsStorage {
    private loadData(userId?: string): VideoAnalyticsData[] {
        if (!userId) return [];
        
        const userFile = getUserAnalyticsFile(userId);
        if (fs.existsSync(userFile)) {
            try {
                return JSON.parse(fs.readFileSync(userFile, 'utf-8'));
            } catch (error) {
                console.error(`Failed to parse analytics file for user ${userId}:`, error);
                return [];
            }
        }

        // Mock data for Dev User
        if (userId === 'dev-id-001') {
            return [
                {
                    youtubeId: 'v1',
                    title: 'The Future of AI Automation',
                    topic: 'AI Technology',
                    templateId: 'modern',
                    texts: ['Build Agents', 'Scale Fast'],
                    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
                    channelId: 'UC_DEV_001',
                    channelName: 'AgentX Dev Channel',
                    stats: { viewCount: '12540', likeCount: '840', commentCount: '124', lastUpdated: new Date().toISOString() }
                },
                {
                    youtubeId: 'v2',
                    title: 'Next.js 16 + Convex Tutorial',
                    topic: 'Web Dev',
                    templateId: 'tech',
                    texts: ['Fast Backend', 'Easy Auth'],
                    uploadedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
                    channelId: 'UC_DEV_001',
                    channelName: 'AgentX Dev Channel',
                    stats: { viewCount: '8750', likeCount: '620', commentCount: '89', lastUpdated: new Date().toISOString() }
                },
                {
                    youtubeId: 'v3',
                    title: 'Why I Switched to AgentX',
                    topic: 'Productivity',
                    templateId: 'minimal',
                    texts: ['Save 10h/week', 'Automate 100%'],
                    uploadedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
                    channelId: 'UC_DEV_001',
                    channelName: 'AgentX Dev Channel',
                    stats: { viewCount: '24300', likeCount: '1900', commentCount: '340', lastUpdated: new Date().toISOString() }
                }
            ];
        }

        return [];
    }

    private saveData(userId: string, data: VideoAnalyticsData[]): void {
        const userFile = getUserAnalyticsFile(userId);
        try {
            fs.writeFileSync(userFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Failed to save analytics file for user ${userId}:`, error);
        }
    }

    addVideo(userId: string, data: Omit<VideoAnalyticsData, 'uploadedAt' | 'stats'>): void {
        const allData = this.loadData(userId);
        const newEntry: VideoAnalyticsData = {
            ...data,
            uploadedAt: new Date().toISOString(),
            stats: {
                viewCount: '0',
                likeCount: '0',
                commentCount: '0',
                lastUpdated: new Date().toISOString()
            }
        };
        allData.push(newEntry);
        this.saveData(userId, allData);
    }

    updateStats(userId: string, youtubeId: string, stats: VideoAnalyticsData['stats']): void {
        const allData = this.loadData(userId);
        const index = allData.findIndex(v => v.youtubeId === youtubeId);
        if (index !== -1) {
            allData[index].stats = stats;
            this.saveData(userId, allData);
        }
    }

    updateData(userId: string, youtubeId: string, updates: Partial<VideoAnalyticsData>): void {
        const allData = this.loadData(userId);
        const index = allData.findIndex(v => v.youtubeId === youtubeId);
        if (index !== -1) {
            allData[index] = { ...allData[index], ...updates };
            this.saveData(userId, allData);
        }
    }

    getAll(userId: string): VideoAnalyticsData[] {
        return this.loadData(userId);
    }

    getTopPerforming(userId: string, limit: number = 5): VideoAnalyticsData[] {
        const allData = this.loadData(userId);
        return allData
            .sort((a, b) => {
                const viewsA = parseInt(a.stats?.viewCount || '0');
                const viewsB = parseInt(b.stats?.viewCount || '0');
                return viewsB - viewsA;
            })
            .slice(0, limit);
    }
}

export const analyticsStorage = new AnalyticsStorage();
