import { z } from 'zod';

const isServer = typeof window === 'undefined';

const envSchema = z.object({
    // Backend (Convex)
    NEXT_PUBLIC_CONVEX_URL: z.string().url().optional(), // Optional for now to allow local dev setup
    
    // Supabase (deprecated)
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    // Database (optional if not using Prisma yet)
    DATABASE_URL: z.string().url().optional(),
    DIRECT_URL: z.string().url().optional(),

    // Google Gemini
    GOOGLE_API_KEY: isServer ? z.string().min(1) : z.string().min(1).optional(),

    // Twitter/X
    TWITTER_APP_KEY: isServer ? z.string().min(1) : z.string().min(1).optional(),
    TWITTER_APP_SECRET: isServer ? z.string().min(1) : z.string().min(1).optional(),
    TWITTER_ACCESS_TOKEN: isServer ? z.string().min(1) : z.string().min(1).optional(),
    TWITTER_ACCESS_SECRET: isServer ? z.string().min(1) : z.string().min(1).optional(),

    // Encryption
    ENCRYPTION_SECRET: z.string().min(32).default('agentx-default-secret-key-32ch-long-enough'),

    // YouTube
    YOUTUBE_CLIENT_ID: isServer ? z.string().min(1) : z.string().min(1).optional(),
    YOUTUBE_CLIENT_SECRET: isServer ? z.string().min(1) : z.string().min(1).optional(),
    YOUTUBE_REDIRECT_URI: isServer ? z.string().url() : z.string().url().optional(),

    // Instagram/Facebook (optional)
    INSTAGRAM_APP_ID: z.string().min(1).optional(),
    INSTAGRAM_APP_SECRET: z.string().min(1).optional(),
    INSTAGRAM_REDIRECT_URI: z.string().url().optional(),

    // Next.js
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    if (isServer) {
        console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.issues, null, 2));
        throw new Error('Invalid environment variables');
    } else {
        // On client, we don't throw to avoid crashing the UI for missing secrets
        console.warn('⚠️ Environment validation skipped on client');
    }
}

export const env = _env.success ? _env.data : {} as any;
