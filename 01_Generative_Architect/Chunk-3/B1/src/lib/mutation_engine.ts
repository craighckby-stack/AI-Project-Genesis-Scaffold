import { Brain } from './brain';
import { extname } from 'path';

/**
 * MutationEngine: Dalek Sovereign Splicer.
 * Optimized for high-throughput DNA restructuring and genetic validation.
 */
export class MutationEngine {
  static readonly #LETHAL_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs']);
  static readonly #CONFLICT_MARKERS = /<<<<<<<|=======|>>>>>>>/;
  static readonly #ASYNC_CTOR = Object.getPrototypeOf(async function () {}).constructor;
  
  static readonly #DNA_SCRUBBER = /\/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*$|^\s*import\s+(?:[\s\S]*?from\s+)?['"].*?['"](?:\s*;?)?|^\s*export\s+(?:default\s+|(?=\{|\*|const|let|var|function|class|type|interface))|^\s*export\s+\{[\s\S]*?\}|(?<=^|;)\s*export\s+/gm;

  readonly #entropyCalc: (content: string) => number;

  constructor(
    private readonly brain: Brain,
    calculateEntropy?: (content: string) => number
  ) {
    this.#entropyCalc = calculateEntropy ?? ((c) => (c.length > 0 ? Math.log2(c.length) : 0));
  }

  /**
   * INITIATE ATOMIC SPLICING
   * Executes genetic modification of the system DNA stream.
   */
  async mutate(filePath: string, DNA: string, shield?: unknown): Promise<boolean> {
    const timestamp = performance.now();
    console.log(`[▲] ATOMIC SPLICING INITIATED: ${filePath}`);

    try {
      if (this.#isLethal(DNA, filePath)) {
        console.error(`[☢] CRITICAL: Lethal Mutation detected in DNA stream for ${filePath}. INITIALIZING GLOBAL REFACTOR.`);
        await this.brain.globalRefactor(shield);
        return false;
      }

      const entropy = this.#entropyCalc(DNA);
      
      // Update Brain state with atomic precision
      this.brain.updateChunk(filePath, DNA);

      // Finalize genetic integration
      await this.brain.globalRefactor(shield);

      const latency = (performance.now() - timestamp).toFixed(3);
      console.log(`[⚡] INTEGRATING GENETIC DATA: ${DNA.length} bytes | Entropy: ${entropy.toFixed(4)} | Latency: ${latency}ms`);

      return true;
    } catch (error) {
      console.error(`[MutationEngine] EXTERMINATE! Mutation failed for ${filePath}:`, error);
      return false;
    }
  }

  #isLethal(DNA: string, filePath: string): boolean {
    // Immediate rejection of void, corrupted streams, or Git conflicts
    if (!DNA?.trim() || MutationEngine.#CONFLICT_MARKERS.test(DNA)) return true;

    // Non-executable files bypass deep syntax validation
    if (!MutationEngine.#LETHAL_EXTENSIONS.has(extname(filePath))) return false;

    const sanitized = DNA.replace(MutationEngine.#DNA_SCRUBBER, '').trim();
    if (!sanitized) return false;

    try {
      // Validate syntax integrity via high-speed constructor invocation
      new MutationEngine.#ASYNC_CTOR(sanitized);
      return false;
    } catch (error) {
      return error instanceof SyntaxError;
    }
  }
}