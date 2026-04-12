/**
 * KeyManager handles rotation of multiple API keys (Gemini, YouTube Apps)
 * to bypass quota limits and enable parallel processing.
 */
class KeyManager {
    private keys: string[] = [];
    private currentIndex: number = 0;

    private youtubeApps: { id: string, secret: string }[] = [];
    private youtubeIndex: number = 0;

    private youtubeApiKeys: string[] = [];
    private youtubeApiKeyIndex: number = 0;

    private failedKeys: Map<string, number> = new Map();
    private failedYouTubeApps: Map<string, number> = new Map();
    private failedYouTubeApiKeys: Map<string, number> = new Map();
    private invalidKeys: Set<string> = new Set();
    private invalidYouTubeApps: Set<string> = new Set();
    private invalidYouTubeApiKeys: Set<string> = new Set();
    private REFRESH_TIMEOUT = 10 * 60 * 1000; // 10 minutes (Retry failed keys after 10 mins)

    constructor() {
        this.loadKeys();
    }

    private loadKeys() {
        // --- Gemini Keys ---
        const multiKeys = process.env.GOOGLE_API_KEYS;
        if (multiKeys) {
            this.keys = multiKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
        }

        const singleKey = process.env.GOOGLE_API_KEY;
        if (singleKey && !this.keys.includes(singleKey)) {
            this.keys.push(singleKey.trim());
        }
        this.keys = this.keys.filter(k => k.length > 0);

        // --- YouTube API Keys (Public Data) ---
        const ytKeys = process.env.YOUTUBE_API_KEYS || process.env.GOOGLE_API_KEYS; // Fallback to Gemini keys which often have YT enabled
        if (ytKeys) {
            this.youtubeApiKeys = ytKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
        }
        const singleYtKey = process.env.YOUTUBE_API_KEY;
        if (singleYtKey && !this.youtubeApiKeys.includes(singleYtKey)) {
            this.youtubeApiKeys.push(singleYtKey.trim());
        }

        console.log(`[KeyManager] Loaded ${this.keys.length} Gemini Keys and ${this.youtubeApiKeys.length} YouTube API Keys.`);

        // --- YouTube Apps (OAuth) ---
        const multiApps = process.env.YOUTUBE_APPS; // Format: ID|SECRET,ID|SECRET
        if (multiApps) {
            const apps = multiApps.split(',').map(a => a.trim()).filter(a => a.length > 0);
            apps.forEach(app => {
                const [id, secret] = app.split('|');
                if (id && secret) {
                    this.youtubeApps.push({ id: id.trim(), secret: secret.trim() });
                }
            });
        }

        const singleId = process.env.YOUTUBE_CLIENT_ID;
        const singleSecret = process.env.YOUTUBE_CLIENT_SECRET;
        if (singleId && singleSecret && !this.youtubeApps.find(a => a.id === singleId)) {
            this.youtubeApps.push({ id: singleId.trim(), secret: singleSecret.trim() });
        }

        console.log(`[KeyManager] Loaded ${this.youtubeApps.length} YouTube Apps.`);
    }

    /**
     * Get the next available Gemini key
     */
    public getNextKey(): string | null {
        if (this.keys.length === 0) return null;
        
        const now = Date.now();
        for (let i = 0; i < this.keys.length; i++) {
            const key = this.keys[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.keys.length;

            if (this.invalidKeys.has(key)) continue;

            const failedAt = this.failedKeys.get(key);
            if (!failedAt || now - failedAt > this.REFRESH_TIMEOUT) {
                this.failedKeys.delete(key);
                return key;
            }
        }
        return this.keys[0];
    }

    /**
     * Get the next available YouTube API Key (for public data)
     */
    public getNextYouTubeApiKey(): string | null {
        if (this.youtubeApiKeys.length === 0) return null;
        
        const now = Date.now();
        for (let i = 0; i < this.youtubeApiKeys.length; i++) {
            const key = this.youtubeApiKeys[this.youtubeApiKeyIndex];
            this.youtubeApiKeyIndex = (this.youtubeApiKeyIndex + 1) % this.youtubeApiKeys.length;

            if (this.invalidYouTubeApiKeys.has(key)) continue;

            const failedAt = this.failedYouTubeApiKeys.get(key);
            if (!failedAt || now - failedAt > this.REFRESH_TIMEOUT) {
                this.failedYouTubeApiKeys.delete(key);
                return key;
            }
        }
        return this.youtubeApiKeys[0];
    }

    /**
     * Get the next available YouTube app (OAuth)
     */
    public getNextYouTubeApp(): { id: string, secret: string } | null {
        if (this.youtubeApps.length === 0) return null;
        
        const now = Date.now();
        for (let i = 0; i < this.youtubeApps.length; i++) {
            const app = this.youtubeApps[this.youtubeIndex];
            this.youtubeIndex = (this.youtubeIndex + 1) % this.youtubeApps.length;

            if (this.invalidYouTubeApps.has(app.id)) continue;

            const failedAt = this.failedYouTubeApps.get(app.id);
            if (!failedAt || now - failedAt > this.REFRESH_TIMEOUT) {
                this.failedYouTubeApps.delete(app.id);
                return app;
            }
        }
        return this.youtubeApps[0];
    }

    public markKeyFailed(key: string) {
        if (!key) return;
        this.failedKeys.set(key, Date.now());
    }

    public markYouTubeApiKeyFailed(key: string) {
        if (!key) return;
        this.failedYouTubeApiKeys.set(key, Date.now());
        console.warn(`[KeyManager] YouTube API Key marked as FAILED: ${key.substring(0, 8)}...`);
    }

    public markYouTubeAppFailed(id: string) {
        if (!id) return;
        this.failedYouTubeApps.set(id, Date.now());
        console.warn(`[KeyManager] YouTube App marked as FAILED: ${id.substring(0, 10)}...`);
    }

    public markKeyInvalid(key: string) {
        if (!key) return;
        this.invalidKeys.add(key);
        console.warn(`[KeyManager] Gemini Key marked as PERMANENTLY INVALID: ${key.substring(0, 8)}...`);
    }

    public markYouTubeApiKeyInvalid(key: string) {
        if (!key) return;
        this.invalidYouTubeApiKeys.add(key);
        console.warn(`[KeyManager] YouTube API Key marked as PERMANENTLY INVALID: ${key.substring(0, 8)}...`);
    }

    public markYouTubeAppInvalid(id: string) {
        if (!id) return;
        this.invalidYouTubeApps.add(id);
        console.warn(`[KeyManager] YouTube App marked as PERMANENTLY INVALID: ${id.substring(0, 10)}...`);
    }


    public isYouTubeAppFailed(id: string): boolean {
        if (!id) return false;
        const failedAt = this.failedYouTubeApps.get(id);
        if (!failedAt) return false;
        return (Date.now() - failedAt) < this.REFRESH_TIMEOUT;
    }

    public hasAvailableYouTubeApps(): boolean {
        if (this.youtubeApps.length === 0) return false;
        const now = Date.now();
        return this.youtubeApps.some(app => {
            const failedAt = this.failedYouTubeApps.get(app.id);
            return !failedAt || now - failedAt > this.REFRESH_TIMEOUT;
        });
    }

    public getYouTubeAppCount(): number {
        return this.youtubeApps.length;
    }

    public getAllYouTubeApps(): { id: string, secret: string }[] {
        return [...this.youtubeApps];
    }

    public getAllKeys(): string[] {
        return [...this.keys];
    }
}

// Singleton instance
export const keyManager = new KeyManager();
