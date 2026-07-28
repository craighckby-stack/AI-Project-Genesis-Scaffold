import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { promisify } from 'util';
import pLimit from 'p-limit';

const brotliCompress = promisify(zlib.brotliCompress);

/**
 * BRAIN-FIREBASE-RUNTIME: DNA PACKER (Phase 2.2)
 * Optimized for true asynchronous I/O, native compression, and binary efficiency.
 */

export async function packDirectory(dirPath: string) {
  const limit = pLimit(50); // 50 concurrent async reads

  // Note: recursive readdirSync requires Node.js v20+
  const allFiles = fs.readdirSync(dirPath, { recursive: true }) as string[];
  const evolvableExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.html', '.css'];
  
  const filePaths = allFiles.filter(f => {
    const fullPath = path.join(dirPath, f);
    try {
      if (!fs.statSync(fullPath).isFile()) return false;
    } catch {
      return false;
    }
    
    const isCodeFile = evolvableExtensions.some(ext => f.endsWith(ext));
    const isHiddenFile = f.split(path.sep).some(part => part.startsWith('.'));
    const isNodeModule = f.includes('node_modules');
    const isDist = f.includes('dist/') || f.includes('build/');
    
    return isCodeFile && !isHiddenFile && !isNodeModule && !isDist;
  });

  console.log(`Scanning ${filePaths.length} evolvable files...`);

  // 1. Read all files concurrently (Truly async now)
  const chunks = await Promise.all(filePaths.map(fp => 
    limit(async () => {
      const fullPath = path.join(dirPath, fp);
      const content = await fsPromises.readFile(fullPath, 'utf-8');
      return { path: fp, content };
    })
  ));

  console.log(`Concatenation complete. Packing into binary format...`);
  
  // 2. Efficient binary packing: [pathLen 2B][contentLen 4B][path][content]
  const encoder = new TextEncoder();
  let totalSize = 0;
  
  const encodedChunks = chunks.map(c => {
    const pathBuf = encoder.encode(c.path);
    const contentBuf = encoder.encode(c.content);
    totalSize += 6 + pathBuf.length + contentBuf.length;
    return { pathBuf, contentBuf };
  });

  const binaryData = new Uint8Array(totalSize);
  const view = new DataView(binaryData.buffer);
  let offset = 0;

  for (const { pathBuf, contentBuf } of encodedChunks) {
    view.setUint16(offset, pathBuf.length, true);      // Little-endian
    view.setUint32(offset + 2, contentBuf.length, true); // Little-endian
    offset += 6;
    binaryData.set(pathBuf, offset);
    offset += pathBuf.length;
    binaryData.set(contentBuf, offset);
    offset += contentBuf.length;
  }

  console.log(`Binary packing complete. Compressing with native Brotli...`);
  
  // 3. Compress using Node's native zlib
  const compressed = await brotliCompress(binaryData, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
    }
  });
  
  const base64 = compressed.toString('base64');

  console.log(`Compression complete.`);
  console.log(`Final Base64 Length: ${base64.length}`);
  
  return {
    base64,
    fileCount: filePaths.length,
    originalSize: totalSize,
    compressedSize: compressed.length
  };
}

// Support CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetDir = process.argv[2] || './src';
  packDirectory(targetDir).then(res => {
    fs.writeFileSync('brain_dna_payload.txt', res.base64);
    console.log(`Payload saved to brain_dna_payload.txt`);
  }).catch(console.error);
}
