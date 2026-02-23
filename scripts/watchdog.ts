import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Scheduler Watchdog
 * Ensures the scheduler script is always running.
 * Restarts it if it crashes or stops.
 */

function log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [WATCHDOG] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(path.join(process.cwd(), 'scheduler.log'), logMessage);
}

function startScheduler() {
    log('Starting scheduler process...');

    const child = spawn('npx', ['tsx', 'scripts/scheduler.ts'], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, FORCE_COLOR: 'true' }
    });

    child.on('close', (code) => {
        if (code !== 0 && code !== null) {
            log(`Scheduler process exited with error code ${code}.`);
        } else {
            log(`Scheduler process stopped (code ${code}).`);
        }

        log('Restarting scheduler in 10 seconds...');
        setTimeout(startScheduler, 10000);
    });

    child.on('error', (err) => {
        log(`Failed to start scheduler: ${err.message}`);
        setTimeout(startScheduler, 30000);
    });
}

log('Watcher initialized. Monitoring scheduler...');
startScheduler();
