const isProduction = process.env.NODE_ENV === 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const log = (level: LogLevel, message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (isProduction) {
        // In production, you might want to send this to a service like Axiom, Datadog, or Sentry
        if (level === 'error') {
            console.error(logMessage, ...args);
        } else if (level === 'warn') {
            console.warn(logMessage, ...args);
        } else {
            console.log(logMessage, ...args);
        }
    } else {
        // Development logging
        if (level === 'error') {
            console.error(logMessage, ...args);
        } else if (level === 'warn') {
            console.warn(logMessage, ...args);
        } else if (level === 'debug') {
            console.debug(logMessage, ...args);
        } else {
            console.log(logMessage, ...args);
        }
    }
};

export const logger = {
    info: (message: string, ...args: any[]) => log('info', message, ...args),
    warn: (message: string, ...args: any[]) => log('warn', message, ...args),
    error: (message: string, ...args: any[]) => log('error', message, ...args),
    debug: (message: string, ...args: any[]) => log('debug', message, ...args),
};
