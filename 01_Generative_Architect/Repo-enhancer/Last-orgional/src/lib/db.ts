import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import * as fs from 'fs'
import { execSync } from 'child_process'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaDir = path.join(process.cwd(), 'prisma')
const dbPath = path.join(prismaDir, 'dev.db')

let prismaInstance: PrismaClient | null = null;

function getPrismaInstance(): PrismaClient {
  if (prismaInstance) {
    return prismaInstance;
  }

  if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
    prismaInstance = globalForPrisma.prisma;
    return prismaInstance;
  }

  const sqliteUrl = `file:${dbPath}?connection_limit=1&socket_timeout=15`;
  prismaInstance = new PrismaClient({
    datasources: {
      db: {
        url: sqliteUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : [],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
  return prismaInstance;
}

// Global runWithRetry helper for proxying and recovering
async function runWithRetry(
  prop: string | symbol,
  modelProp: string | symbol | null,
  targetFunc: (...args: any[]) => any,
  thisArg: any,
  args: any[]
): Promise<any> {
  try {
    return await targetFunc.apply(thisArg, args);
  } catch (err: any) {
    const errMsg = String(err?.message || err?.stack || err || '').toLowerCase();
    if (errMsg.includes('malformed') || errMsg.includes('corrupt') || errMsg.includes('disk image')) {
      console.warn('[Prisma Recovery] Database corruption detected! Running automatic recovery...');
      try {
        // 1. Disconnect current client if possible
        if (prismaInstance) {
          await prismaInstance.$disconnect().catch(() => {});
        }
        globalForPrisma.prisma = undefined;
        prismaInstance = null;

        // 2. Delete dev.db and journal files
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
        }
        for (const suffix of ['-journal', '-wal', '-shm']) {
          const p = dbPath + suffix;
          if (fs.existsSync(p)) {
            fs.unlinkSync(p);
          }
        }

        // 3. Push schema
        console.log('[Prisma Recovery] DB files cleared. Running prisma db push...');
        execSync('npx prisma db push --accept-data-loss', {
          env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
          stdio: 'inherit'
        });
        console.log('[Prisma Recovery] DB schema recreated successfully!');

        // 4. Get a fresh client instance
        const freshInstance = getPrismaInstance();

        // 5. Get the fresh function to retry
        let freshFunc: (...args: any[]) => any;
        let freshThisArg: any;
        if (modelProp === null) {
          // Client level function
          freshFunc = Reflect.get(freshInstance, prop);
          freshThisArg = freshInstance;
        } else {
          // Model level function
          const freshModel = Reflect.get(freshInstance, prop);
          freshFunc = Reflect.get(freshModel, modelProp);
          freshThisArg = freshModel;
        }

        console.log('[Prisma Recovery] Retrying original query on fresh database...');
        return await freshFunc.apply(freshThisArg, args);
      } catch (recoveryErr) {
        console.error('[Prisma Recovery] Database recovery failed:', recoveryErr);
      }
    }
    throw err;
  }
}

// Highly dynamic proxy wrapper
function wrapPrisma(getFreshInstance: () => PrismaClient): PrismaClient {
  return new Proxy({} as any, {
    get(target, prop) {
      const currentInstance = getFreshInstance();
      const value = Reflect.get(currentInstance, prop);
      if (!value) return value;

      if (typeof value === 'function') {
        // Client level functions like $connect, $disconnect, $queryRaw
        return new Proxy(value, {
          apply(funcTarget, thisArg, args) {
            return runWithRetry(prop, null, funcTarget, thisArg, args);
          }
        });
      } else if (typeof value === 'object') {
        // Model level objects like db.session, db.mutationHistory
        return new Proxy(value, {
          get(modelTarget, modelProp) {
            const val = Reflect.get(modelTarget, modelProp);
            if (typeof val === 'function') {
              return new Proxy(val, {
                apply(methodTarget, methodThisArg, args) {
                  return runWithRetry(prop, modelProp, methodTarget, methodThisArg, args);
                }
              });
            }
            return val;
          }
        });
      }
      return value;
    }
  });
}

export const db = wrapPrisma(getPrismaInstance);

