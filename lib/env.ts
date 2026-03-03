import { z } from 'zod';

const envSchema = z.object({
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    // Database
    DATABASE_URL: z.string().url(),
    DIRECT_URL: z.string().url(),

    // Google Gemini
    GOOGLE_API_KEY: z.string().min(1),

    // Twitter/X
    TWITTER_API_KEY: z.string().min(1),
    TWITTER_API_SECRET: z.string().min(1),
    TWITTER_ACCESS_TOKEN: z.string().min(1),
    TWITTER_ACCESS_SECRET: z.string().min(1),

    // Encryption
    ENCRYPTION_SECRET: z.string().min(32).default('agentx-default-secret-key-32ch-long-enough'),

    // YouTube
    YOUTUBE_CLIENT_ID: z.string().min(1),
    YOUTUBE_CLIENT_SECRET: z.string().min(1),
    YOUTUBE_REDIRECT_URI: z.string().url(),

    // Instagram/Facebook
    INSTAGRAM_APP_ID: z.string().min(1),
    INSTAGRAM_APP_SECRET: z.string().min(1),
    INSTAGRAM_REDIRECT_URI: z.string().url(),

    // Next.js
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Invalid environment variables:', _env.error.format());
    throw new Error('Invalid environment variables');
}

export const env = _env.data;
