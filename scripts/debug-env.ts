import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv'; // We need to install dotenv if not present, but nextjs context usually has it. 
// Actually simpler to just read the file manually to avoid dependency issues in this script context if possible, 
// but dotenv is safer to parse multiline etc. The user has dotenv in package.json.

// Manually parse to be sure we are reading the file on disk
const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.log('Error reading .env.local');
    process.exit(1);
}

// Simple parser
const vars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let value = match[2].trim();
        // remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        vars[match[1].trim()] = value;
    }
});

const report = [];
const dbUrl = vars['DATABASE_URL'];

if (!dbUrl) {
    report.push('DATABASE_URL is NOT defined in .env.local');
} else {
    report.push(`DATABASE_URL defined: Yes`);
    report.push(`Length: ${dbUrl.length}`);
    report.push(`Starts with "postgresql://": ${dbUrl.startsWith('postgresql://')}`);
    report.push(`Starts with "postgres://": ${dbUrl.startsWith('postgres://')}`);
    report.push(`Starts with "file:": ${dbUrl.startsWith('file:')}`);
    report.push(`Starts with "sqlite:": ${dbUrl.startsWith('sqlite:')}`);
    report.push(`Contains "?pgbouncer=true": ${dbUrl.includes('?pgbouncer=true')}`);
    // Check first 10 chars safely
    report.push(`First 10 chars: "${dbUrl.substring(0, 10)}..."`);
}

const directUrl = vars['DIRECT_URL'];
if (!directUrl) {
    report.push('DIRECT_URL is NOT defined in .env.local');
} else {
    report.push(`DIRECT_URL defined: Yes`);
    report.push(`Starts with "postgresql://": ${directUrl.startsWith('postgresql://')}`);
}

fs.writeFileSync('env-debug-report.txt', report.join('\n'));
console.log('Report written to env-debug-report.txt');
