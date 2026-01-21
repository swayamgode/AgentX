import fs from 'fs';
import path from 'path';

const ANALYTICS_FILE = path.join(process.cwd(), '.video-analytics.json');

export interface VideoAnalyticsData {
    youtubeId: string;
    title: string;
    topic: string;
    templateId: string;
    texts: string[];
    thumbnailUrl?: string;
    uploadedAt: string;
    stats?: {
        viewCount: string;
        likeCount: string;
        commentCount: string;
        lastUpdated: string;
    };
}

class AnalyticsStorage {
    private loadData(): VideoAnalyticsData[] {
        if (fs.existsSync(ANALYTICS_FILE)) {
            try {
                return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
            } catch (error) {
                console.error('Failed to parse analytics file:', error);
                return [];
            }
        }
        return [];
    }

    private saveData(data: VideoAnalyticsData[]): void {
        try {
            fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Failed to save analytics file:', error);
        }
    }

    addVideo(data: Omit<VideoAnalyticsData, 'uploadedAt' | 'stats'>): void {
        const allData = this.loadData();
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
        this.saveData(allData);
    }

    updateStats(youtubeId: string, stats: VideoAnalyticsData['stats']): void {
        const allData = this.loadData();
        const index = allData.findIndex(v => v.youtubeId === youtubeId);
        if (index !== -1) {
            allData[index].stats = stats;
            this.saveData(allData);
        }
    }

    updateData(youtubeId: string, updates: Partial<VideoAnalyticsData>): void {
        const allData = this.loadData();
        const index = allData.findIndex(v => v.youtubeId === youtubeId);
        if (index !== -1) {
            allData[index] = { ...allData[index], ...updates };
            this.saveData(allData);
        }
    }

    getAll(): VideoAnalyticsData[] {
        return this.loadData();
    }

    getTopPerforming(limit: number = 5): VideoAnalyticsData[] {
        const allData = this.loadData();
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
