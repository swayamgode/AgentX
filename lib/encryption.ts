import crypto from 'crypto';

// Use a secret key from environment or generate one
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'agentx-default-secret-key-32ch';
const ALGORITHM = 'aes-256-cbc';

// Ensure key is 32 bytes for AES-256
const KEY = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export function maskApiKey(key: string): string {
    if (key.length <= 8) return '****';
    return '****' + key.slice(-4);
}
