import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.join(process.cwd(), '.youtube-tokens.json');

interface YouTubeTokens {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
}

export const tokenStorage = {
    save: (tokens: YouTubeTokens) => {
        try {
            // Read existing to preserve refresh token if new one is missing
            let existing: YouTubeTokens = {} as any;
            if (fs.existsSync(TOKEN_FILE)) {
                existing = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
            }

            const toSave = {
                ...existing,
                ...tokens,
                refresh_token: tokens.refresh_token || existing.refresh_token // Keep old refresh token if not provided
            };

            fs.writeFileSync(TOKEN_FILE, JSON.stringify(toSave, null, 2));
            console.log('YouTube tokens saved to file');
        } catch (error) {
            console.error('Failed to save tokens:', error);
        }
    },

    load: (): YouTubeTokens | null => {
        try {
            if (fs.existsSync(TOKEN_FILE)) {
                return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
            }
        } catch (error) {
            console.error('Failed to load tokens:', error);
        }
        return null;
    }
};
