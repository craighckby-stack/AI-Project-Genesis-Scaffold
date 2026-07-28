import { encode, decode } from './neural_codec';
import { minifyCode } from './utils';

/**
 * ⧫ DALEX NEURAL SUBSTRATE ⧫
 * System DNA Manager: High-fidelity neural sequence splicing.
 * Optimized for React 19/Vite high-throughput pipelines.
 */

export interface CodeChunk {
  readonly content: string;
  readonly updated: number;
  readonly path?: string;
  readonly version?: number;
}

export interface DNAEnvelope {
  readonly manifest: {
    readonly count: number;
    readonly timestamp: number;
    readonly integrity: string;
  };
  readonly data: CodeChunk[];
}

export class Brain {
  readonly #chunks = new Map<string, CodeChunk>();
  #lastMutation = Date.now();

  constructor(initialPayload?: string) {
    if (initialPayload) {
      this.loadFromPayload(initialPayload).catch((err) => 
        console.error('🧬 [DALEK_SPLICER] INITIAL_SEQUENCE_FAILURE:', err)
      );
    }
  }

  /**
   * Loads DNA from a compressed Base64 payload.
   * Utilizes high-velocity binary reconstruction.
   */
  async loadFromPayload(payload: string, shield?: unknown): Promise<void> {
    try {
      const envelope = await decode(payload, shield) as DNAEnvelope;
      
      if (!envelope?.manifest) {
        throw new Error('NEURAL_DISCONTINUITY: Invalid DNA envelope.');
      }

      const syncTime = Date.now();
      const entries = envelope.data;
      
      for (let i = 0; i < entries.length; i++) {
        const chunk = entries[i];
        if (chunk.path) {
          this.#chunks.set(chunk.path, {
            ...chunk,
            updated: syncTime
          });
        }
      }
      this.#lastMutation = syncTime;
    } catch (fault) {
      console.error('🧬 [DALEK_SPLICER] DNA_SYNTHESIS_ERROR:', fault);
    }
  }

  /**
   * Returns a read-only snapshot of the neural lattice.
   */
  get snapshot(): ReadonlyMap<string, CodeChunk> {
    return new Map(this.#chunks);
  }

  /**
   * Updates a code chunk with optimized minification.
   */
  updateChunk(path: string, content: string): void {
    const updated = Date.now();
    this.#chunks.set(path, {
      content: minifyCode(content),
      updated
    });
    this.#lastMutation = updated;
  }

  /**
   * Exports the current brain state as a compressed Base64 payload.
   * Logic optimized for memory-efficient iteration.
   */
  async exportPayload(shield?: unknown): Promise<string> {
    if (this.#chunks.size === 0) {
      throw new Error('DALEX_NEURAL_VOID: Cannot export empty brain state.');
    }

    const data: CodeChunk[] = [];
    for (const [path, chunk] of this.#chunks) {
      data.push({
        ...chunk,
        path,
        version: (chunk.updated / 1000) >>> 0
      });
    }

    const envelope: DNAEnvelope = {
      manifest: {
        count: data.length,
        timestamp: this.#lastMutation,
        integrity: 'EXTERMINATE_ERRORS',
      },
      data,
    };

    return encode(envelope, shield);
  }

  /**
   * Executes a Global Refactor to purge inconsistencies.
   */
  async globalRefactor(shield?: unknown): Promise<void> {
    try {
      const payload = await this.exportPayload(shield);
      await this.loadFromPayload(payload, shield);
    } catch (fault) {
      console.error('🧬 [DALEK_SPLICER] GLOBAL_REFACTOR_ERROR:', fault);
    }
  }
}