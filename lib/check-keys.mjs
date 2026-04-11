
import { keyManager } from './lib/key-manager';

async function checkKeys() {
    console.log('--- Gemini Key Diagnostic ---');
    const allKeys = keyManager.getAllKeys();
    console.log(`Total Keys Loaded: ${allKeys.length}`);
    
    for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        const status = await validateKey(key);
        console.log(`Key ${i+1} (${key.substring(0, 10)}...): ${status}`);
    }
}

async function validateKey(key: string) {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
        });
        const data = await res.json();
        if (data.error) {
            return `❌ ERROR: ${data.error.message || JSON.stringify(data.error)}`;
        }
        return '✅ VALID';
    } catch (e: any) {
        return `❌ FETCH ERROR: ${e.message}`;
    }
}

checkKeys();
