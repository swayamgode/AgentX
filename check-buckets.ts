
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabase } from './lib/supabase';

async function listBuckets() {
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Error listing buckets:', error);
        } else {
            console.log('Buckets:', data);
        }
    } catch (e) {
        console.error(e);
    }
}

listBuckets();
