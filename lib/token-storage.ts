import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export interface YouTubeTokens {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
}

export interface YouTubeAccount {
    id: string; // Map Convex _id to id
    channelName: string;
    channelId: string;
    email: string;                      
    watermark: string;
    thumbnailUrl?: string;
    subscriberCount?: string;
    videoCount?: string;
    viewCount?: string;
    tokens: YouTubeTokens;
    appCredentials?: {
        clientId: string;
        clientSecret: string;
    };
    createdAt: string;
}

class ConvexTokenStorage {
    private client: ConvexHttpClient;

    constructor() {
        this.client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    }

    async addAccount(userId: string, account: Omit<YouTubeAccount, 'id' | 'createdAt'>): Promise<YouTubeAccount> {
        const id = await this.client.mutation(api.youtube.addAccount, {
            userId,
            account
        });
        return {
            ...account,
            id: id as string,
            createdAt: new Date().toISOString()
        };
    }

    async removeAccount(userId: string, accountId: string): Promise<boolean> {
        return await this.client.mutation(api.youtube.removeAccount, { userId, accountId });
    }

    async updateAccount(userId: string, accountId: string, updates: Partial<Omit<YouTubeAccount, 'id' | 'createdAt'>>): Promise<boolean> {
        // Since addAccount in convex/youtube.ts handles patching if channelId matches, 
        // we can use it, but we need the full account data usually.
        // For simple updates like watermark:
        await this.client.mutation(api.youtube.addAccount as any, {
            userId,
            account: { channelId: accountId, ...updates }
        });
        return true;
    }

    async setActiveAccount(userId: string, accountId: string): Promise<boolean> {
        await this.client.mutation(api.youtube.updateSettings as any, {
            userId,
            settings: { activeAccountId: accountId }
        });
        return true;
    }

    async getActiveAccount(userId: string): Promise<YouTubeAccount | null> {
        const settings = await this.client.query(api.youtube.getSettings, { userId });
        const accounts = await this.getAllAccounts(userId);
        
        const activeId = settings?.activeAccountId || (accounts.length > 0 ? accounts[0].id : null);
        if (!activeId) return null;
        
        return accounts.find(a => a.id === activeId) || null;
    }

    async getAccount(userId: string, accountId: string): Promise<YouTubeAccount | null> {
        const accounts = await this.getAllAccounts(userId);
        return accounts.find(a => a.id === accountId) || null;
    }

    async getAllAccounts(userId: string): Promise<YouTubeAccount[]> {
        const accounts = await this.client.query(api.youtube.listAccounts, { userId });
        return accounts.map(acc => ({
            ...acc,
            id: acc._id,
        })) as YouTubeAccount[];
    }

    async updateTokens(userId: string, accountId: string, tokens: Partial<YouTubeTokens>): Promise<boolean> {
        // accountId here is likely the Convex ID or channelId? 
        // In our API routes, we use Convex IDs now for accountId.
        const accounts = await this.getAllAccounts(userId);
        const account = accounts.find(a => a.id === accountId);
        if (!account) return false;

        await this.client.mutation(api.youtube.addAccount as any, {
            userId,
            account: {
                channelId: account.channelId,
                tokens: { ...account.tokens, ...tokens }
            }
        });
        return true;
    }
}

// Export singleton instance
export const multiAccountStorage = new ConvexTokenStorage();

// Legacy compatibility - uses active account
export const tokenStorage = {
    save: async (userId: string, tokens: YouTubeTokens) => {
        const active = await multiAccountStorage.getActiveAccount(userId);
        if (active) {
            await multiAccountStorage.updateTokens(userId, active.id, tokens);
        }
    },

    load: async (userId: string): Promise<YouTubeTokens | null> => {
        const active = await multiAccountStorage.getActiveAccount(userId);
        return active ? active.tokens : null;
    }
};
