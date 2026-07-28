export const SYSTEM_CONFIG = { version: '3.0.0', mode: 'OMEGA', debug: true };
export const logEvent = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);