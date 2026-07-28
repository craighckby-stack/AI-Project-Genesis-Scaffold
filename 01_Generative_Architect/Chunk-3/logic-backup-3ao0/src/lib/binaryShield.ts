
export class BinaryShield {
  private key: CryptoKey | null = null;

  constructor(private keyHex: string) {}

  private hexToBuffer(hex: string): ArrayBuffer {
    if (hex.length % 2 !== 0) {
      throw new Error("Invalid hex string length.");
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  async initialize() {
    try {
      const keyBuffer = this.hexToBuffer(this.keyHex);
      if (keyBuffer.byteLength !== 32) {
        throw new Error("Master Key must be 32 bytes (64 hex characters).");
      }
      this.key = await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        "AES-GCM",
        false,
        ["encrypt", "decrypt"]
      );
    } catch (e) {
      throw new Error(`Encryption Initialization Failed: ${e}`);
    }
  }

  async encryptPacket(plaintext: string): Promise<any> {
    if (!this.key) await this.initialize();
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce },
      this.key!,
      encoded
    );

    return {
      data: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(nonce),
      timestamp: Math.floor(Date.now() / 1000),
      algorithm: "AES-256-GCM"
    };
  }

  async decryptPacket(packet: any): Promise<string> {
    try {
      if (!this.key) await this.initialize();
      const nonce = this.base64ToArrayBuffer(packet.iv);
      const ciphertext = this.base64ToArrayBuffer(packet.data);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: nonce },
        this.key!,
        ciphertext
      );
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error("Decryption failed:", e);
      return `// [DECRYPTION_ERROR] ${e}`;
    }
  }
}
