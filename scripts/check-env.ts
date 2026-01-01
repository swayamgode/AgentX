import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function checkEnv() {
    console.log('--- Environment Check ---');

    const dbUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;

    if (!dbUrl) {
        console.error('❌ DATABASE_URL is missing');
    } else {
        if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
            console.log('✅ DATABASE_URL format is valid (postgresql://...)');
        } else {
            console.error('❌ DATABASE_URL must start with postgresql:// or postgres://');
            console.log('   Current value starts with: ' + dbUrl.substring(0, 10) + '...');
        }

        if (dbUrl.includes('pgbouncer=true')) {
            console.log('✅ Connection pooling (pgbouncer) detected');
        } else {
            console.warn('⚠️  Warning: DATABASE_URL should end with ?pgbouncer=true for Supabase transaction mode');
        }
    }

    if (!directUrl) {
        console.error('❌ DIRECT_URL is missing');
    } else {
        if (directUrl.startsWith('postgresql://') || directUrl.startsWith('postgres://')) {
            console.log('✅ DIRECT_URL format is valid');
        } else {
            console.error('❌ DIRECT_URL must start with postgresql:// or postgres://');
        }
    }
}

checkEnv();
