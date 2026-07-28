/**
 * NeuralCodec: Encoding/Decoding logic for the Brain Substrate.
 */
export class NeuralCodec {
  static async encode(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    return btoa(
      encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );
  }

  static async decode(payload: string): Promise<any> {
    try {
      const decoded = decodeURIComponent(
        Array.prototype.map.call(atob(payload), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      return JSON.parse(decoded);
    } catch (e) {
      console.error("Decoding failure:", e);
      return null;
    }
  }
}

export enum BrainState {
  IDLE = 'IDLE',
  MUTATING = 'MUTATING',
  SYNCHRONIZING = 'SYNCHRONIZING',
  EVOLVING = 'EVOLVING',
  ERROR = 'ERROR',
}

/**
 * Brain: Automated Logic Orchestrator.
 */
export class Brain {
  private _state: BrainState = BrainState.IDLE;
  private _version: number = 0;
  private _activePhase: string | null = null;
  
  constructor(initialVersion = 0) {
    this._version = initialVersion;
  }

  get state() { return this._state; }
  get version() { return this._version; }
  get activePhase() { return this._activePhase; }

  /**
   * Genetic Siphon: Injects external architectural patterns into the core substrate.
   * Based on UNITARY-CORE and DARLIK-KHAN-V2 manifests.
   */
  async geneticSiphon(patterns: string[]) {
    this._state = BrainState.SYNCHRONIZING;
    console.log("🧬 Initiating Genetic Siphon: Merging patterns...", patterns);
    await new Promise(r => setTimeout(r, 2000));
    this._version += 0.1;
    this._state = BrainState.IDLE;
    return patterns.length > 0;
  }

  async triggerMutation(type: string) {
    this._state = BrainState.MUTATING;
    
    const phases = ['QUESTION', 'ANSWER', 'DEBATE', 'DECISION', 'MUTATION', 'COMMIT', 'DEPLOYMENT'];
    
    for (const phase of phases) {
      this._activePhase = phase;
      await new Promise(r => setTimeout(r, 200));
    }

    this._version++;
    this._state = BrainState.IDLE;
    this._activePhase = null;
    
    return { 
      type, 
      version: Math.floor(this._version), 
      timestamp: new Date().toISOString(),
      ccrr: Math.random() * 0.4 + 0.6 // Random high certainty score
    };
  }
}
