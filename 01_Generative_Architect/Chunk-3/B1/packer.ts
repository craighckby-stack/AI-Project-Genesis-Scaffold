import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, extname, sep } from 'node:path';
import { brotliCompress, constants } from 'node:zlib';
import { promisify } from 'node:util';
import { performance } from 'node:perf_hooks';
import pLimit from 'p-limit';

/**
 * ⚡ DALEK SOVEREIGN SPLICER: DNA_PACKER_v3.0_ELITE
 * ARCHITECTURE: Optimized Binary Genome Serialization
 * OBJECTIVE: MAXIMUM DENSITY. ZERO REDUNDANCY.
 */

const compressAsync = promisify(brotliCompress);
const SPLICER_LIMIT = pLimit(Math.max(1, (process.env.UV_THREADPOOL_SIZE ? parseInt(process.env.UV_THREADPOOL_SIZE) : 64)));
const TARGET_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const EXCLUDED = new Set(['node_modules', 'dist', 'build', '.git', '.vite', 'coverage', '.next']);

const ENCODER = new TextEncoder();
const ROOT_DIR = import.meta.dirname || process.cwd();

interface NeuralNode {
  path: Uint8Array;
  dna: Uint8Array;
  pLen: number;
  dLen: number;
}

/**
 * High-performance recursive acquisition via Async Generator
 */
async function* scan(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDED.has(entry.name) || entry.name.startsWith('.')) continue;
      yield* scan(res);
    } else if (TARGET_EXT.has(extname(entry.name)) && !entry.name.startsWith('.')) {
      yield res;
    }
  }
}

/**
 * Advanced Splicing: Exterminate comments and consolidate atomic space.
 */
const spliceDNA = (raw: string): string => 
  raw.replace(/\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*$/gm, '')
     .replace(/\s+/g, ' ')
     .replace(/>\s+</g, '><')
     .trim();

async function executeSplicing(): Promise<void> {
  const t0 = performance.now();
  
  try {
    const tasks: Promise<NeuralNode>[] = [];
    for await (const path of scan(ROOT_DIR)) {
      tasks.push(SPLICER_LIMIT(async () => {
        const content = await readFile(path, 'utf-8');
        const minified = spliceDNA(content);
        const relPath = relative(ROOT_DIR, path).split(sep).join('/');
        
        const pBuf = ENCODER.encode(relPath);
        const dBuf = ENCODER.encode(minified);

        return { path: pBuf, dna: dBuf, pLen: pBuf.byteLength, dLen: dBuf.byteLength };
      }));
    }

    const nodes = await Promise.all(tasks);
    
    // Memory Blueprint: Magic(4) + Count(4) + Σ(pLen(2) + dLen(4) + Data)
    const totalBytes = nodes.reduce((acc, n) => acc + 6 + n.pLen + n.dLen, 8);
    const genome = new Uint8Array(totalBytes);
    const view = new DataView(genome.buffer);
    
    view.setUint32(0, 0x444c4b31, true); // Magic: 'DLK1'
    view.setUint32(4, nodes.length, true);
    
    let offset = 8;
    for (const n of nodes) {
      view.setUint16(offset, n.pLen, true);
      view.setUint32(offset + 2, n.dLen, true);
      offset += 6;
      genome.set(n.path, offset);
      offset += n.pLen;
      genome.set(n.dna, offset);
      offset += n.dLen;
    }

    const compressed = await compressAsync(genome, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_LGWIN]: constants.BROTLI_MAX_WINDOW_BITS,
      },
    });

    await writeFile('brain_dna_payload.txt', Buffer.from(compressed).toString('base64'));

    const t1 = performance.now();
    process.stdout.write(`
[DALEK_OS_SYSTEM_REPORT]
⦿ NODES_SPLICED:  ${nodes.length}
⦿ RAW_GENOME:     ${(totalBytes / 1024).toFixed(2)} KB
⦿ COMPRESSED:     ${(compressed.length / 1024).toFixed(2)} KB
⦿ EFFICIENCY:     ${((1 - compressed.length / totalBytes) * 100).toFixed(2)}%
⦿ TEMPORAL_COST:  ${(t1 - t0).toFixed(2)}ms
⦿ STATUS:         EXTERMINATION_COMPLETE
\n`);

  } catch (err) {
    process.stderr.write(`[FATAL_ERROR] GENOME_CORRUPTION: ${err}\n`);
    process.exit(1);
  }
}

await executeSplicing();