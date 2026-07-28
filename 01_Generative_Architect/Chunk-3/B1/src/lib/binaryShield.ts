import { safeAtob, bufferToBase64 } from './utils';

const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

/**
 * @class BinaryShield
 * @description Dalek-grade AES-256-GCM encryption handler.
 * Optimized for React 19/Vite environments with zero-latency overhead.
 */
export class BinaryShield {
  #key: CryptoKey | null = null;
  readonly #keyHex: string;

  constructor(keyHex: string) {
    if (keyHex.length !== 64) {
      throw new Error("💠 APEX_SPLICER_CRITICAL: Master Key must be 256-bit (64 hex chars).");
    }
    this.#keyHex = keyHex;
  }

  /**
   * Optimized Hex-to-Buffer conversion via bitwise shift.
   */
  #hexToBuffer(hex: string): Uint8Array {
    const len = hex.length;
    const bytes = new Uint8Array(len >> 1);
    for (let i = 0; i < len; i += 2) {
      bytes[i >> 1] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes;
  }

  /**
   * Maps Base64 payload to Uint8Array using high-speed iteration.
   */
  #b64ToUint8(b64: string): Uint8Array {
    const binary = safeAtob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Fetches the Master Key into the WebCrypto Subtle subspace.
   */
  async #initialize(): Promise<CryptoKey> {
    if (this.#key) return this.#key;

    try {
      this.#key = await crypto.subtle.importKey(
        "raw",
        this.#hexToBuffer(this.#keyHex),
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );
      return this.#key;
    } catch (e) {
      throw new Error(`Σ_CRYPTO_FAILURE:INITIALIZATION_ABORTED: ${e}`);
    }
  }

  /**
   * Encapsulates plaintext into an encrypted Nexus packet.
   */
  async encryptPacket(plaintext: string): Promise<{ data: string; iv: string; metadata: { v: string; ts: number } }> {
    if (!plaintext) throw new Error("Σ_CRYPTO_FAILURE:NULL_INPUT_DETECTED");

    try {
      const [key, iv] = await Promise.all([
        this.#initialize(),
        crypto.getRandomValues(new Uint8Array(12))
      ]);

      const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, tagLength: 128 },
        key,
        ENCODER.encode(plaintext)
      );

      return {
        data: bufferToBase64(new Uint8Array(ciphertext)),
        iv: bufferToBase64(iv),
        metadata: {
          v: "nexus.1",
          ts: Date.now(),
        },
      };
    } catch (atomicError) {
      throw new Error(`Σ_CRYPTO_FAILURE:ENCRYPTION_SPLICING_FAULT: ${atomicError}`);
    }
  }

  /**
   * Decodes and decrypts a Nexus packet with failsafe diagnostics.
   */
  async decryptPacket(packet: { iv: string; data: string } | any): Promise<string> {
    try {
      if (!packet?.iv || !packet?.data) {
        throw new Error("Σ_CRYPTO_FAILURE:MALFORMED_PACKET");
      }

      const key = await this.#initialize();
      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: this.#b64ToUint8(packet.iv),
          tagLength: 128,
        },
        key,
        this.#b64ToUint8(packet.data)
      );

      return DECODER.decode(decrypted);
    } catch (e) {
      const diag = e instanceof Error ? e.message : "CORE_SHIELD_FAILURE";
      return `// [DECRYPTION_ERROR] ${diag.toUpperCase()}`;
    }
  }
}