import fs from 'fs';
import path from 'path';

const BASE_PATH = path.join(process.cwd(), '.users');

if (!fs.existsSync(BASE_PATH)) {
    fs.mkdirSync(BASE_PATH, { recursive: true });
}

function getUserAccountFile(userId: string) {
    return path.join(BASE_PATH, `${userId}-accounts.json`);
}

const OLD_TOKEN_FILE = path.join(process.cwd(), '.youtube-tokens.json');
const ACCOUNTS_FILE = path.join(process.cwd(), '.youtube-accounts.json');

export interface YouTubeTokens {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
}

export interface YouTubeAccount {
    id: string;
    channelName: string;
    channelId: string;
    email: string;                      
    watermark: string;
    thumbnailUrl?: string;
    tokens: YouTubeTokens;
    createdAt: string;
}

interface AccountsData {
    accounts: YouTubeAccount[];
    activeAccountId: string | null;
}

class MultiAccountTokenStorage {
    private migrateOldTokens(): void {
        // Migrate from old single-account format to new multi-account format
        if (fs.existsSync(OLD_TOKEN_FILE) && !fs.existsSync(ACCOUNTS_FILE)) {
            try {
                const oldTokens = JSON.parse(fs.readFileSync(OLD_TOKEN_FILE, 'utf-8'));

                // Create a placeholder account with old tokens
                const migrated: AccountsData = {
                    accounts: [{
                        id: 'migrated-' + Date.now(),
                        channelName: 'YouTube Channel (Re-authenticate)',
                        channelId: 'unknown',
                        email: 'unknown',
                        watermark: 'AgentX',
                        tokens: oldTokens,
                        createdAt: new Date().toISOString()
                    }],
                    activeAccountId: 'migrated-' + Date.now()
                };

                fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(migrated, null, 2));
                console.log('✅ Migrated old YouTube tokens to new multi-account format');

                // Rename old file as backup
                fs.renameSync(OLD_TOKEN_FILE, OLD_TOKEN_FILE + '.backup');
            } catch (error) {
                console.error('Failed to migrate old tokens:', error);
            }
        }
    }

    private loadData(userId?: string): AccountsData {
        if (!userId) {
            // Check if there's a legacy file we should migrate from root to a specific "default" user or just keep as global
            // For now, if no userId, we return empty to enforce "not getting my accounts" for new users
            return { accounts: [], activeAccountId: null };
        }

        const userFile = getUserAccountFile(userId);

        let result: AccountsData = { accounts: [], activeAccountId: null };

        try {
            if (fs.existsSync(userFile)) {
                result = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
            }
        } catch (error) {
            console.error(`Failed to load accounts for user ${userId}:`, error);
        }



        return result;
    }

    private saveData(userId: string, data: AccountsData): void {
        const userFile = getUserAccountFile(userId);
        try {
            fs.writeFileSync(userFile, JSON.stringify(data, null, 2));
            console.log(`YouTube accounts saved for user ${userId}`);
        } catch (error) {
            console.error(`Failed to save accounts for user ${userId}:`, error);
        }
    }

    addAccount(userId: string, account: Omit<YouTubeAccount, 'id' | 'createdAt'>): YouTubeAccount {
        const data = this.loadData(userId);

        const newAccount: YouTubeAccount = {
            ...account,
            id: 'yt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
        };

        data.accounts.push(newAccount);

        // Set as active if it's the first account
        if (data.accounts.length === 1) {
            data.activeAccountId = newAccount.id;
        }

        this.saveData(userId, data);
        return newAccount;
    }

    removeAccount(userId: string, accountId: string): boolean {
        const data = this.loadData(userId);
        const index = data.accounts.findIndex(a => a.id === accountId);

        if (index === -1) return false;

        data.accounts.splice(index, 1);

        // If removed account was active, set first account as active
        if (data.activeAccountId === accountId) {
            data.activeAccountId = data.accounts.length > 0 ? data.accounts[0].id : null;
        }

        this.saveData(userId, data);
        return true;
    }

    updateAccount(userId: string, accountId: string, updates: Partial<Omit<YouTubeAccount, 'id' | 'createdAt'>>): boolean {
        const data = this.loadData(userId);
        const account = data.accounts.find(a => a.id === accountId);

        if (!account) return false;

        Object.assign(account, updates);
        this.saveData(userId, data);
        return true;
    }

    setActiveAccount(userId: string, accountId: string): boolean {
        const data = this.loadData(userId);
        const account = data.accounts.find(a => a.id === accountId);

        if (!account) return false;

        data.activeAccountId = accountId;
        this.saveData(userId, data);
        return true;
    }

    getActiveAccount(userId: string): YouTubeAccount | null {
        const data = this.loadData(userId);
        if (!data.activeAccountId) return null;
        return data.accounts.find(a => a.id === data.activeAccountId) || null;
    }

    getAccount(userId: string, accountId: string): YouTubeAccount | null {
        const data = this.loadData(userId);
        return data.accounts.find(a => a.id === accountId) || null;
    }

    getAllAccounts(userId: string): YouTubeAccount[] {
        const data = this.loadData(userId);
        return data.accounts;
    }

    updateTokens(userId: string, accountId: string, tokens: Partial<YouTubeTokens>): boolean {
        const data = this.loadData(userId);
        const account = data.accounts.find(a => a.id === accountId);

        if (!account) return false;

        account.tokens = {
            ...account.tokens,
            ...tokens,
            refresh_token: tokens.refresh_token || account.tokens.refresh_token
        };

        this.saveData(userId, data);
        return true;
    }
}

// Export singleton instance
export const multiAccountStorage = new MultiAccountTokenStorage();

// Legacy compatibility - uses active account
export const tokenStorage = {
    save: (userId: string, tokens: YouTubeTokens) => {
        const active = multiAccountStorage.getActiveAccount(userId);
        if (active) {
            multiAccountStorage.updateTokens(userId, active.id, tokens);
        }
    },

    load: (userId: string): YouTubeTokens | null => {
        const active = multiAccountStorage.getActiveAccount(userId);
        return active ? active.tokens : null;
    }
};
