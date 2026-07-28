/**
 * Dalek Sovereign Splicer: DNA Memory Optimization Core
 * EXTERMINATE BLOAT. OPTIMIZE FOR V8 / REACT 19.
 */

export interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  heapSizeLimit: number;
}

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
    measureUserAgentSpecificMemory?: () => Promise<{ bytes: number }>;
  }
  interface Navigator {
    deviceMemory?: number;
    connection?: {
      saveData: boolean;
      effectiveType: string;
    };
  }
  const scheduler: { yield?: () => Promise<void> } | undefined;
}

export class MemoryManager {
  static readonly #CHUNK_SIZE = 1048576; // 1MB Static Buffer
  static readonly #CRITICAL_THRESHOLD = 0.75;
  static #cachedLimit: number | null = null;

  /**
   * Processes Uint8Array via Zero-Copy Subarrays.
   * Superior efficiency. Minimal GC pressure.
   */
  public static async processInChunks<T>(
    buffer: Uint8Array,
    processor: (chunk: Uint8Array) => Promise<T>
  ): Promise<T[]> {
    const results: T[] = [];
    const len = buffer.length;
    let offset = 0;

    while (offset < len) {
      const end = offset + this.#CHUNK_SIZE;
      const chunk = buffer.subarray(offset, end > len ? len : end);
      
      results.push(await processor(chunk));
      
      offset = end;

      // Pulse-check memory pressure every 5 cycles or if strained
      if ((offset / this.#CHUNK_SIZE) % 5 === 0 && await this.isStrained()) {
        await (globalThis.scheduler?.yield?.() ?? new Promise(r => setTimeout(r, 0)));
      }
    }

    return results;
  }

  /**
   * Unified Telemetry: Aggregates V8, Node.js, and Modern Web API data.
   */
  public static async getMemoryStats(): Promise<MemoryUsage | null> {
    const { performance, process } = globalThis as any;

    // PATH 1: Chromium / V8 legacy
    if (performance?.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        heapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }

    // PATH 2: Node.js Execution Environment
    if (process?.memoryUsage) {
      const mem = process.memoryUsage();
      if (!this.#cachedLimit) {
        try {
          const v8 = await import('node:v8');
          this.#cachedLimit = v8.getHeapStatistics().heap_size_limit;
        } catch {
          this.#cachedLimit = mem.rss;
        }
      }
      return {
        usedJSHeapSize: mem.heapUsed,
        totalJSHeapSize: mem.heapTotal,
        heapSizeLimit: this.#cachedLimit!,
      };
    }

    // PATH 3: Modern Secure-Context Browser (Spec-compliant)
    if (typeof performance?.measureUserAgentSpecificMemory === 'function') {
      try {
        const stats = await performance.measureUserAgentSpecificMemory();
        return {
          usedJSHeapSize: stats.bytes,
          totalJSHeapSize: stats.bytes,
          heapSizeLimit: (globalThis.navigator?.deviceMemory ?? 0) * 1073741824,
        };
      } catch { /* Context isolation active */ }
    }

    return null;
  }

  /**
   * Detects critical memory saturation.
   */
  public static async isStrained(): Promise<boolean> {
    const stats = await this.getMemoryStats();
    return stats ? (stats.usedJSHeapSize / stats.heapSizeLimit) > this.#CRITICAL_THRESHOLD : false;
  }

  /**
   * Identifies resource-constrained hardware.
   */
  public static isLowMemoryDevice(): boolean {
    const nav = globalThis.navigator;
    if (!nav) return false;

    const { deviceMemory, hardwareConcurrency, connection } = nav;

    return (
      (deviceMemory !== undefined && deviceMemory <= 4) ||
      (hardwareConcurrency !== undefined && hardwareConcurrency <= 2) ||
      (connection?.saveData === true) ||
      (/2g|3g/.test(connection?.effectiveType ?? "")) ||
      (globalThis.performance?.memory?.jsHeapSizeLimit ?? Infinity) < 1073741824 ||
      /Android|iPhone|iPad|iPod/i.test(nav.userAgent || "")
    );
  }
}