import { promises as fs } from 'fs';
import path from 'path';

/**
 * @file scripts/migration-engine.ts
 * @version 4.0.0
 * @description Sovereign Migration Kernel. Orchestrates atomic refactoring across the repository.
 * Siphoned from: sovereign-kernel / darlek-cann-v3 architecture.
 */

interface MigrationSchema {
  tokenMap: Record<string, string>;
  targetExtensions: string[];
}

const SCHEMA: MigrationSchema = {
  tokenMap: {
    'bg-zinc-900': 'bg-glass-deep-900',
    'border-zinc-800': 'border-glass-subtle',
    'text-zinc-400': 'text-glass-muted',
  },
  targetExtensions: ['.tsx', '.ts', '.js', '.jsx']
};

/**
 * Atomic file processor with backup capability.
 */
async function processFile(filePath: string): Promise<void> {
  const content = await fs.readFile(filePath, 'utf-8');
  let evolvedContent = content;

  Object.entries(SCHEMA.tokenMap).forEach(([oldToken, newToken]) => {
    // Use word boundary regex to prevent partial token corruption
    const regex = new RegExp(`\\b${oldToken}\\b`, 'g');
    evolvedContent = evolvedContent.replace(regex, newToken);
  });

  if (content !== evolvedContent) {
    await fs.writeFile(`${filePath}.bak`, content); // Transactional safety
    await fs.writeFile(filePath, evolvedContent, 'utf-8');
}
}

/**
 * Recursive directory traversal for deep project integration.
 */
async function walk(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(res);
    } else if (SCHEMA.targetExtensions.some(ext => entry.name.endsWith(ext))) {
      await processFile(res);
    }
  }
}

export async function runMigration(targetDir: string): Promise<void> {
try {
    await walk(targetDir);
} catch (error) {
    console.error('--- Migration Critical Failure ---', error);
    throw error;
  }
}



