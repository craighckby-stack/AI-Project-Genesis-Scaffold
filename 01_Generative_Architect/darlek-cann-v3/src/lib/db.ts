import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaDir = path.join(process.cwd(), 'prisma')
const dbPath = path.join(prismaDir, 'dev.db')

// Clean up any remaining WAL files which cause severe corruption in container environments
function cleanupWalFiles() {
  try {
    const walPath = path.join(prismaDir, 'dev.db-wal');
    if (fs.existsSync(walPath)) {
      try { fs.unlinkSync(walPath); } catch (e) {}
    }
    const shmPath = path.join(prismaDir, 'dev.db-shm');
    if (fs.existsSync(shmPath)) {
      try { fs.unlinkSync(shmPath); } catch (e) {}
    }
  } catch (err) {
    // ignore
  }
}

export function performSelfHealing() {
  try {
    console.warn('[Database Setup] Self-healing initiated. Deleting database to rebuild fresh schema...');
    
    // Explicitly delete DB artifact and journals
    if (fs.existsSync(dbPath)) {
      try { fs.unlinkSync(dbPath); } catch (e) {}
    }
    cleanupWalFiles();
execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
} catch (healErr) {
    console.error('[Database Setup] Self-healing fatal failure:', healErr);
  }
}

// Ensure database file exists, if not create it
if (!fs.existsSync(dbPath)) {
  performSelfHealing();
}

let prismaInstance: PrismaClient;

if (globalForPrisma.prisma) {
  prismaInstance = globalForPrisma.prisma;
} else {
  // Always clean up WAL junk files before starting to prevent WAL locks
  cleanupWalFiles();

  prismaInstance = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
  });

  // Optimize SQLite parameters safely (No WAL in gVisor sandboxes to avoid disk image malformation)
  prismaInstance.$queryRawUnsafe('PRAGMA journal_mode=TRUNCATE;')
    .then(() => {
      return prismaInstance.$queryRawUnsafe('PRAGMA busy_timeout=15000;');
    })
    .then(() => {
      return prismaInstance.$queryRawUnsafe('PRAGMA synchronous=NORMAL;');
    })
    .catch((err) => {
      const errMsg = String(err?.message || err || '').toLowerCase();
      if (errMsg.includes('malformed') || errMsg.includes('corrupt') || errMsg.includes('disk image')) {
        console.error('[Prisma] CRITICAL CORRUPTION CORRECTION ENGAGED inside optimizer:', err);
        performSelfHealing();
      } else {
        console.warn('[Prisma] SQLite optimization warning:', err);
      }
    });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
}

// Proxied client to intercept and auto-heal on any malformed database error dynamically.
// This guarantees that if a malformed database error happens on any future query, the app
// heals the database immediately and does not remain dead.
export const db = new Proxy(prismaInstance, {
  get(target, prop, receiver) {
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === 'function') {
      return function (...args: any[]) {
        try {
          const res = value.apply(target, args);
          if (res instanceof Promise) {
            return res.catch((err) => {
              const errMsg = String(err?.message || err || '').toLowerCase();
              if (errMsg.includes('malformed') || errMsg.includes('corrupt') || errMsg.includes('disk image')) {
                console.error('[Prisma Proxy] INTERCEPTED CORRUPTED DB ERROR during propagation:', err);
                performSelfHealing();
                throw new Error('Database was corrupt and has been automatically rebuilt. Please retry your request.');
              }
              throw err;
            });
          }
          return res;
        } catch (err) {
          const errMsg = String(err || '').toLowerCase();
          if (errMsg.includes('malformed') || errMsg.includes('corrupt') || errMsg.includes('disk image')) {
            console.error('[Prisma Proxy] INTERCEPTED CORRUPTED DB ERROR:', err);
            performSelfHealing();
            throw new Error('Database was corrupt and has been automatically rebuilt. Please retry your request.');
          }
          throw err;
        }
      };
    }
    // For nested fields/models (e.g., db.session.findFirst) we need to wrap the model calls as well
    if (value && typeof value === 'object' && !('then' in value)) {
      return new Proxy(value, {
        get(subTarget, subProp, subReceiver) {
          const subValue = Reflect.get(subTarget, subProp, subReceiver);
          if (typeof subValue === 'function') {
            return function (...subArgs: any[]) {
              try {
                const res = subValue.apply(subTarget, subArgs);
                if (res instanceof Promise) {
                  return res.catch((err) => {
                    const errMsg = String(err?.message || err || '').toLowerCase();
                    if (errMsg.includes('malformed') || errMsg.includes('corrupt') || errMsg.includes('disk image')) {
                      console.error('[Prisma Proxy Sub] INTERCEPTED CORRUPTED DB ERROR:', err);
                      performSelfHealing();
                      throw new Error('Database was corrupt and has been automatically rebuilt. Please retry your request.');
                    }
                    throw err;
                  });
                }
                return res;
              } catch (err) {
                const errMsg = String(err || '').toLowerCase();
                if (errMsg.includes('malformed') || errMsg.includes('corrupt') || errMsg.includes('disk image')) {
                  console.error('[Prisma Proxy Sub] INTERCEPTED CORRUPTED DB ERROR:', err);
                  performSelfHealing();
                  throw new Error('Database was corrupt and has been automatically rebuilt. Please retry your request.');
                }
                throw err;
              }
            };
          }
          return subValue;
        }
      });
    }
    return value;
  }
});




