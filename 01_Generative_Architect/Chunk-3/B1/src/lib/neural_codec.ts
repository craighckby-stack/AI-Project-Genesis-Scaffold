import { base64ToBuffer, bufferToBase64, safeJSONParse } from './utils';
import brotliWasm from 'brotli-wasm';

const BROTLI_INST = brotliWasm();
const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

export class NeuralCodec {
  private static readonly MAGIC = 0x4252414E; // "BRAN"
  private static readonly VERSION = 1;

  static async encode(chunks: { path: string; content: string }[], shield?: { protect: (d: Uint8Array) => Promise<Uint8Array> }): Promise<string> {
    try {
      const brotli = await BROTLI_INST;
      const fragments = chunks.map(c => ({
        p: ENCODER.encode(c.path),
        c: ENCODER.encode(c.content)
      }));

      const payloadLen = fragments.reduce((acc, f) => acc + 6 + f.p.byteLength + f.c.byteLength, 0);
      const buffer = new Uint8Array(13 + payloadLen);
      const view = new DataView(buffer.buffer);

      view.setUint32(0, this.MAGIC, false);
      view.setUint8(4, this.VERSION);
      view.setUint32(5, chunks.length, false);

      let offset = 13;
      for (const { p, c } of fragments) {
        view.setUint16(offset, p.byteLength, false);
        view.setUint32(offset + 2, c.byteLength, false);
        offset += 6;
        buffer.set(p, offset);
        offset += p.byteLength;
        buffer.set(c, offset);
        offset += c.byteLength;
      }

      view.setUint32(9, this.adler32(buffer.subarray(13)), false);

      let compressed = brotli.compress(buffer, { mode: 0, quality: 11, lgwin: 22 });
      if (shield?.protect) compressed = await shield.protect(compressed);

      return bufferToBase64(compressed);
    } catch (e) {
      throw new Error(`DALK_CODEC_ENC_ERR: ${e instanceof Error ? e.message : 'FATAL'}`);
    }
  }

  static async decode(payload: string, shield?: { unprotect: (d: Uint8Array) => Promise<Uint8Array> }): Promise<{ path: string; content: string }[]> {
    try {
      if (!payload) return [];
      const raw = payload.trim().replace(/\s/g, '');

      if (raw.startsWith('[') || raw.startsWith('{')) {
        const parsed = safeJSONParse(raw);
        return Array.isArray(parsed) ? parsed : [];
      }

      const brotli = await BROTLI_INST;
      let data = base64ToBuffer(raw);

      if (shield?.unprotect) data = await shield.unprotect(data);

      let bin: Uint8Array;
      try { bin = brotli.decompress(data); } catch { bin = data; }

      const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
      let ptr = -1;

      // Optimistic header check
      if (view.byteLength >= 13 && view.getUint32(0, false) === this.MAGIC) {
        ptr = 0;
      } else {
        for (let i = 0; i <= bin.length - 13; i++) {
          if (view.getUint32(i, false) === this.MAGIC) { ptr = i; break; }
        }
      }

      if (ptr === -1) throw new Error("DNA_CORRUPTION: MAGIC_NOT_FOUND");

      const count = view.getUint32(ptr + 5, false);
      const checksum = view.getUint32(ptr + 9, false);
      const payloadData = bin.subarray(ptr + 13);

      if (this.adler32(payloadData) !== checksum) throw new Error("DNA_CORRUPTION: CHECKSUM_MISMATCH");

      const result: { path: string; content: string }[] = [];
      let offset = ptr + 13;

      for (let i = 0; i < count; i++) {
        const pLen = view.getUint16(offset, false);
        const cLen = view.getUint32(offset + 2, false);
        offset += 6;
        result.push({
          path: DECODER.decode(bin.subarray(offset, offset + pLen)),
          content: DECODER.decode(bin.subarray(offset + pLen, offset + pLen + cLen))
        });
        offset += pLen + cLen;
      }

      return result;
    } catch (e) {
      console.error("DALK_CODEC_DEC_ERR:", e);
      return [];
    }
  }

  private static adler32(data: Uint8Array): number {
    let a = 1, b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data[i]) % 65521;
      b = (b + a) % 65521;
    }
    return (b << 16 | a) >>> 0;
  }
}

export function minifyCode(code: string, path = ""): string {
  if (/\.(py|ya?ml|md|txt|sh|gd|nim|coffee|pug|slim|styl)$/i.test(path)) return code.trim();

  const literals: string[] = [];
  const store = (m: string) => `\x00_${literals.push(m) - 1}\x00`;

  return code
    .replace(/(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*?\1|(`)(?:\\(?:\r\n|[\s\S])|(?!\2)[\s\S])*?\2/g, store)
    .replace(/\/(?![*+?])(?:[^\r\n\[\/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+\/[gimyusd]*/g, (m, idx, f) => {
      const p = f.slice(0, idx).trim().slice(-1);
      return (!p || /[=(,\[!&|?~><+\-]/.test(p)) ? store(m) : m;
    })
    .replace(/\/\*[\s\S]*?\*\/|(?<![:\/\\])\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}()\[\],;:=<>!&|@#%^?+\-/*])\s*/g, '$1')
    .replace(/\x00_(\d+)\x00/g, (_, i) => literals[+i])
    .trim();
}