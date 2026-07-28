// src/brain-firebase-runtime.ts

/**
 * ⚡ DALEK_SOVEREIGN_SPLICER_OPTIMIZATION: EXTERMINATE_INEFFICIENCY
 * STATUS: SUPREME_SYNTAX_EVOLUTION_COMPLETE
 * PROJECT_CORE: Brain-Firebase Runtime
 */

import { versionJson } from './version.json';

const enum Status {
  CLEAN = 0,
  DIRTY = 1,
  INVALID = 2,
}

/**
 * Δ_CORE_LOGIC: HIGH_PERFORMANCE_RUNTIME_CONTAINER
 */
class BrainRuntimeConfig {
  #v: string;
  #c: string;
  #i: string[];
  #l: Set<string>;
  #s: Status = Status.CLEAN;

  constructor(v: string, c: string = '', i: string[] = []) {
    this.#v = v;
    this.#c = c;
    this.#i = i;
    this.#l = new Set(i);
  }

  get version(): string { return this.#v; }
  set version(val: string) { this.#v = val; }

  get compressedChunks(): string { return this.#c; }
  set compressedChunks(val: string) {
    if (this.#c === val) return;
    this.#c = val ?? '';
    this.#s = Status.DIRTY;
  }

  get isDirty(): boolean { return this.#s === Status.DIRTY; }
  get index(): readonly string[] { return this.#i; }
  get segmentCount(): number { return this.#i.length; }

  /** O(1) Fragment Validation */
  public hasFragment = (id: string): boolean => this.#l.has(id);
  public contains = (id: string): boolean => this.#l.has(id);
  public getIndex = (): string[] => this.#i;

  public invalidate(): void {
    this.#s = Status.INVALID;
  }

  /**
   * Δ_HYDRATION_PROTOCOL: ATOMIC_STATE_UPDATE
   */
  public hydrate({ compressedChunks, index }: { compressedChunks?: string; index?: string[] }): void {
    let mutated = false;

    if (compressedChunks !== undefined && this.#c !== compressedChunks) {
      this.#c = compressedChunks;
      mutated = true;
    }

    if (index !== undefined && this.#i !== index) {
      this.#i = index;
      this.#l = new Set(index);
      mutated = true;
    }

    if (mutated) this.#s = Status.DIRTY;
  }

  public getSnapshot() {
    return {
      version: this.#v,
      compressedChunks: this.#c,
      index: [...this.#i],
    };
  }
}

/**
 * Δ_SYSTEM_INITIALIZATION: DIRECT_MEMORY_ALLOCATION
 * TOP_LEVEL_AWAIT: ENABLED
 */
const brainRuntimeConfig = new BrainRuntimeConfig(versionJson.version);

export default brainRuntimeConfig;