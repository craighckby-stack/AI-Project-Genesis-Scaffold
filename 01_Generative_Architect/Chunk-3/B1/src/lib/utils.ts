/**
 * DALEK-NEXUS: DATA UTILIZATION CORE
 * STATUS: SPLICED | INTEGRITY: SUPREME | PERFORMANCE: ELITE
 */

const DECODER = new TextDecoder();

/**
 * Decodes Base64 with high-velocity normalization.
 * EXTERMINATES latency in UTF-8 reconstruction.
 */
export const safeDecodeBase64 = (base64: string): string => {
  if (!base64) return '';
  try {
    const buffer = base64ToBuffer(base64);
    return buffer.byteLength > 0 ? DECODER.decode(buffer) : '';
  } catch {
    return '';
  }
};

/**
 * Parses JSON string. Returns null upon structural failure.
 * Logic optimized for V8 hidden class stability.
 */
export const safeParseJSON = <T = unknown>(json: string): T | null => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

/**
 * Converts Base64 to Uint8Array. 
 * Environment-agnostic implementation with optimized memory allocation.
 */
export const base64ToBuffer = (base64: string): Uint8Array => {
  try {
    const normalized = base64
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/\s/g, '');

    if (typeof Buffer !== 'undefined') {
      return Uint8Array.from(Buffer.from(normalized, 'base64'));
    }

    const binaryString = globalThis.atob(padBase64(normalized));
    return Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
  } catch {
    return new Uint8Array(0);
  }
};

/**
 * Converts Uint8Array to Base64 string. 
 * Optimized for memory efficiency across massive payloads.
 */
export const bufferToBase64 = (buffer: Uint8Array): string => {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(buffer).toString('base64');
    }
    
    let binary = '';
    const CHUNK_SIZE = 0x8000; // Optimize for stack limit
    for (let i = 0; i < buffer.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode.apply(
        null, 
        buffer.subarray(i, i + CHUNK_SIZE) as unknown as number[]
      );
    }
    return globalThis.btoa(binary);
  } catch {
    return '';
  }
};

/**
 * Validates Base64 compliance via regex-short-circuiting.
 */
export const isValidBase64 = (base64: string): boolean => {
  if (!base64 || typeof base64 !== 'string') return false;
  const cleaned = base64.replace(/\s/g, '');
  return cleaned.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(cleaned);
};

/**
 * Short-circuit JSON validation. 
 * Analyzes α (alpha) and ω (omega) boundaries before full parsing.
 * INTEGRITY CHECK: MANDATORY.
 */
export const isValidJSONString = (json: unknown): json is string => {
  if (typeof json !== 'string') return false;
  const content = json.trim();
  const len = content.length;
  if (len < 2) return false;

  const α = content.charCodeAt(0);
  const ω = content.charCodeAt(len - 1);

  // Check for {} (123/125) or [] (91/93) matches
  if (!((α === 123 && ω === 125) || (α === 91 && ω === 93))) return false;

  try {
    const evolved = JSON.parse(content);
    return evolved !== null && typeof evolved === 'object';
  } catch {
    return false;
  }
};

/**
 * Applies necessary padding to satisfy Base64 length requirements.
 * SPLICING COMPLETE.
 */
export const padBase64 = (base64: string): string => {
  const cleaned = base64.replace(/\s/g, '').replace(/=+$/, '');
  return cleaned.padEnd(cleaned.length + ((4 - (cleaned.length % 4)) % 4), '=');
};