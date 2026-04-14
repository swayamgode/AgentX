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
        const accounts = await this.getAllAccounts(userId);
        const account = accounts.find(a => a.id === accountId);
        if (!account) return false;

        // Must pass all required fields to addAccount (which patches by channelId)
        await this.client.mutation(api.youtube.addAccount, {
            userId,
            account: {
                channelName: account.channelName,
                channelId: account.channelId,
                email: account.email,
                watermark: updates.watermark ?? account.watermark,
                thumbnailUrl: updates.thumbnailUrl ?? account.thumbnailUrl,
                tokens: account.tokens,
                appCredentials: updates.appCredentials ?? account.appCredentials,
            }
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

    /**
     * Updates tokens for an account.
     * FIXED: Previously called addAccount with missing required fields (channelName, email, watermark),
     * which caused Convex schema validation errors and silently discarded refreshed tokens,
     * forcing every upload to fail with "Auth expired" after the first token expiry.
     */
    async updateTokens(userId: string, accountId: string, tokens: Partial<YouTubeTokens>): Promise<boolean> {
        const accounts = await this.getAllAccounts(userId);
        const account = accounts.find(a => a.id === accountId);
        if (!account) {
            console.error(`[updateTokens] Account ${accountId} not found for user ${userId}`);
            return false;
        }

        const mergedTokens: YouTubeTokens = {
            access_token: tokens.access_token ?? account.tokens.access_token,
            refresh_token: tokens.refresh_token ?? account.tokens.refresh_token,
            expiry_date: tokens.expiry_date ?? account.tokens.expiry_date,
        };

        // Pass all required fields — addAccount patches existing record by channelId
        await this.client.mutation(api.youtube.addAccount, {
            userId,
            account: {
                channelName: account.channelName,
                channelId: account.channelId,
                email: account.email,
                watermark: account.watermark,
                thumbnailUrl: account.thumbnailUrl,
                tokens: mergedTokens,
                appCredentials: account.appCredentials,
            }
        });

        console.log(`[updateTokens] Tokens saved for ${account.channelName} (expires ${mergedTokens.expiry_date ? new Date(mergedTokens.expiry_date).toISOString() : 'unknown'})`);
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
