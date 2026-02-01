import fs from 'fs';
import path from 'path';

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

    private loadData(): AccountsData {
        this.migrateOldTokens();

        try {
            if (fs.existsSync(ACCOUNTS_FILE)) {
                return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
            }
        } catch (error) {
            console.error('Failed to load accounts:', error);
        }

        return { accounts: [], activeAccountId: null };
    }

    private saveData(data: AccountsData): void {
        try {
            fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
            console.log('YouTube accounts saved');
        } catch (error) {
            console.error('Failed to save accounts:', error);
        }
    }

    addAccount(account: Omit<YouTubeAccount, 'id' | 'createdAt'>): YouTubeAccount {
        const data = this.loadData();

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

        this.saveData(data);
        return newAccount;
    }

    removeAccount(accountId: string): boolean {
        const data = this.loadData();
        const index = data.accounts.findIndex(a => a.id === accountId);

        if (index === -1) return false;

        data.accounts.splice(index, 1);

        // If removed account was active, set first account as active
        if (data.activeAccountId === accountId) {
            data.activeAccountId = data.accounts.length > 0 ? data.accounts[0].id : null;
        }

        this.saveData(data);
        return true;
    }

    updateAccount(accountId: string, updates: Partial<Omit<YouTubeAccount, 'id' | 'createdAt'>>): boolean {
        const data = this.loadData();
        const account = data.accounts.find(a => a.id === accountId);

        if (!account) return false;

        Object.assign(account, updates);
        this.saveData(data);
        return true;
    }

    setActiveAccount(accountId: string): boolean {
        const data = this.loadData();
        const account = data.accounts.find(a => a.id === accountId);

        if (!account) return false;

        data.activeAccountId = accountId;
        this.saveData(data);
        return true;
    }

    getActiveAccount(): YouTubeAccount | null {
        const data = this.loadData();
        if (!data.activeAccountId) return null;
        return data.accounts.find(a => a.id === data.activeAccountId) || null;
    }

    getAccount(accountId: string): YouTubeAccount | null {
        const data = this.loadData();
        return data.accounts.find(a => a.id === accountId) || null;
    }

    getAllAccounts(): YouTubeAccount[] {
        const data = this.loadData();
        return data.accounts;
    }

    updateTokens(accountId: string, tokens: Partial<YouTubeTokens>): boolean {
        const data = this.loadData();
        const account = data.accounts.find(a => a.id === accountId);

        if (!account) return false;

        account.tokens = {
            ...account.tokens,
            ...tokens,
            refresh_token: tokens.refresh_token || account.tokens.refresh_token
        };

        this.saveData(data);
        return true;
    }
}

// Export singleton instance
export const multiAccountStorage = new MultiAccountTokenStorage();

// Legacy compatibility - uses active account
export const tokenStorage = {
    save: (tokens: YouTubeTokens) => {
        const active = multiAccountStorage.getActiveAccount();
        if (active) {
            multiAccountStorage.updateTokens(active.id, tokens);
        }
    },

    load: (): YouTubeTokens | null => {
        const active = multiAccountStorage.getActiveAccount();
        return active ? active.tokens : null;
    }
};
