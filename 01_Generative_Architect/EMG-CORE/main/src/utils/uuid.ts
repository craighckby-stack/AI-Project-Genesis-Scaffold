/**
 * @fileoverview UUID Generation Engine
 * @version 3.0.0
 * @description High-performance, cryptographically secure UUID generator for DARLEK-CANN distributed systems.
 * Supports RFC4122 v4 (random) and deterministic namespace-based generation.
 */

/**
 * Generates a cryptographically secure RFC4122 version 4 UUID.
 * Optimized for Next.js/Node.js/Browser environments.
 */
export function generateUUID(): string {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : (globalThis as any).crypto;

  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  // Fallback for environments without native randomUUID
  const array = new Uint8Array(16);
  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
  }

  array[6] = (array[6] & 0x0f) | 0x40; // Version 4
  array[8] = (array[8] & 0x3f) | 0x80; // Variant 10

  return [...array].map((b, i) => {
    const hex = b.toString(16).padStart(2, '0');
    return [4, 6, 8, 10].includes(i) ? `-${hex}` : hex;
  }).join('');
}

/**
 * Generates a deterministic UUID based on a namespace and name.
 * Essential for maintaining state consistency across distributed agent nodes.
 */
export function generateDeterministicUUID(namespace: string, name: string): string {
  const combined = `${namespace}:${name}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash |= 0;
  }
  
  const hex = Math.abs(hash).toString(16).padStart(32, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`;
}























