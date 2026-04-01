import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = (env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) 
    ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
    : {
        auth: {
            getUser: async () => ({ data: { user: { email: 'dev@agentx.ai', id: 'dev-id-001' } }, error: null }),
            getSession: async () => ({ data: { session: null }, error: null }),
            signUp: async (args: any) => ({ data: { user: { email: args.email || 'dev@agentx.ai', id: 'dev-id-001' } }, error: null }),
            signInWithPassword: async () => ({ data: { user: { email: 'dev@agentx.ai', id: 'dev-id-001' } }, error: null }),
            signOut: async () => ({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
        from: () => ({
            select: () => ({ single: () => Promise.resolve({ data: null, error: null }), collect: () => Promise.resolve({ data: [], error: null }) }),
            insert: () => Promise.resolve({ data: null, error: null }),
            update: () => Promise.resolve({ data: null, error: null }),
        })
    } as any;
