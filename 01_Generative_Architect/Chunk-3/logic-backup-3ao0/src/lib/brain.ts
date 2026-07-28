/**
 * Packs code chunks into a single compressed base64 string using a binary format.
 * Format: [pathLen 2B][contentLen 4B][path][content]
 * @param chunks Array of objects with path and content.
 * @returns Base64 encoded compressed string.
 */
export async function packDNA(chunks: { path: string, content: string }[]): Promise<string> {
  const brotli = await (await import('brotli-wasm')).default;
  const encoder = new TextEncoder();
  
  // 1. Calculate total size for the uncompressed binary buffer
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

  // 2. Pack chunks: [pathLen 2B][contentLen 4B][path][content]
  for (const { pathBuf, contentBuf } of encodedChunks) {
    view.setUint16(offset, pathBuf.length, true);
    view.setUint32(offset + 2, contentBuf.length, true);
    offset += 6;
    binaryData.set(pathBuf, offset);
    offset += pathBuf.length;
    binaryData.set(contentBuf, offset);
    offset += contentBuf.length;
  }

  // 3. Compress with Brotli
  const compressed = brotli.compress(binaryData);
  
  // 4. Convert to Base64
  let binary = '';
  const len = compressed.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary);
}

/**
 * Unpacks a compressed base64 string into an array of code chunks.
 * @param compressedBase64 Base64 encoded compressed string.
 * @returns Array of objects with path and content.
 */
export async function unpackDNA(compressedBase64: string): Promise<{ path: string, content: string }[]> {
  const brotli = await (await import('brotli-wasm')).default;
  const binaryString = atob(compressedBase64);
  const binaryData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    binaryData[i] = binaryString.charCodeAt(i);
  }
  
  const decompressed = brotli.decompress(binaryData);
  const view = new DataView(decompressed.buffer);
  const decoder = new TextDecoder();
  const chunks: { path: string, content: string }[] = [];
  let offset = 0;

  while (offset < decompressed.length) {
    const pathLen = view.getUint16(offset, true);
    const contentLen = view.getUint32(offset + 2, true);
    offset += 6;
    
    const path = decoder.decode(decompressed.subarray(offset, offset + pathLen));
    offset += pathLen;
    
    const content = decoder.decode(decompressed.subarray(offset, offset + contentLen));
    offset += contentLen;
    
    chunks.push({ path, content });
  }

  return chunks;
}

/**
 * Minifies code by removing comments and extra whitespace.
 * This is a lightweight version for the Brain DNA.
 */
export function minifyCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // Remove single and multi-line comments
    .replace(/\s+/g, ' ') // Collapse all whitespace into single spaces
    .replace(/\s*([{}()\[\],;:=<>!&|+-/*%])\s*/g, '$1') // Remove spaces around operators and punctuation
    .trim();
}
