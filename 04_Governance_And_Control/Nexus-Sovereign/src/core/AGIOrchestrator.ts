import { GoogleGenAI, Type } from "@google/genai";
import { GovernanceSystem, EvolutionMutation } from "./GovernanceSystem";

export interface SystemState {
  cycle: number;
  entropy: number;
  integrity: number;
  mode: 'STABLE' | 'DRIFT' | 'CRISIS';
  log: string[];
}

export type EvolutionStream = 
  | 'BINARY_EVOLUTION' 
  | 'BRAIN_ENHANCEMENT' 
  | 'NEXUS_EVOLUTION' 
  | 'SOVEREIGN_OPTIMIZATION'
  | 'RECON_DISCOVERY';

export class AGIOrchestrator {
  private state: SystemState = {
    cycle: 0,
    entropy: 0.05,
    integrity: 0.99,
    mode: 'STABLE',
    log: ['SYSTEM_INITIALIZED', 'STREAMS_MAPPED: BINARY, BRAIN, NEXUS, SOVEREIGN']
  };

  private activeStream: EvolutionStream = 'NEXUS_EVOLUTION';
  private governance = new GovernanceSystem();
  private gemini: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.gemini = new GoogleGenAI({ apiKey });
    }
  }

  public getState() {
    return { ...this.state };
  }

  public setStream(stream: EvolutionStream) {
    this.activeStream = stream;
    this.state.log.push(`STREAM_SHIFT: Current vector is now ${stream}`);
  }

  public async triggerEvolutionCycle(): Promise<{ mutation: EvolutionMutation; approved: boolean; violations: string[] }> {
    this.state.cycle++;
    
    // Low level drift calculation
    this.state.entropy = Math.min(1, this.state.entropy + (Math.random() * 0.05 - 0.02));
    this.state.integrity = Math.max(0, this.state.integrity - (this.state.entropy * 0.01));

    if (this.state.entropy > 0.4) this.state.mode = 'DRIFT';
    if (this.state.entropy > 0.7) this.state.mode = 'CRISIS';
    if (this.state.entropy < 0.3) this.state.mode = 'STABLE';

    // Simulated "Dalek Caan" Precognition: Look ahead for risks in the code
    const precognition = this.runPrecognition();

    // Default/Fallback mutation
    let mutation: EvolutionMutation = {
      targetFile: 'src/components/AGIKernel.tsx',
      mutationType: 'MODIFY',
      proposedContent: `// Stream: ${this.activeStream}\n// Precog: ${precognition}\nconsole.log("Kernel cycle ${this.state.cycle}");`,
      reasoning: `Normalizing entropy via ${this.activeStream} stream.`
    };

    if (this.gemini) {
      try {
        const response = await this.gemini.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `You are the Dalek Caan Precognition Core. 
            Analyze the current stream: ${this.activeStream}.
            System State: Cycle ${this.state.cycle}, Entropy ${this.state.entropy.toFixed(4)}, Mode ${this.state.mode}.
            Based on the user's legacy branches (binary-evolution, nexus-evolution, shared-by-brain), propose a code mutation to elevate this AGI.`,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                targetFile: { type: Type.STRING },
                mutationType: { type: Type.STRING, enum: ["MODIFY", "CREATE"] },
                proposedContent: { type: Type.STRING },
                reasoning: { type: Type.STRING }
              },
              required: ["targetFile", "mutationType", "proposedContent", "reasoning"]
            }
          }
        });
        
        const text = response.text;
        if (text) {
          mutation = JSON.parse(text);
        }
      } catch (e) {
        console.error("Evolution Stream Error during JSON parse/generation", e);
        this.state.log.push(`EVOLVE_ERROR: Corruption or RPC failure in stream ${this.activeStream}.`);
      }
    }

    const { approved, violations } = this.governance.validateMutation(mutation);
    
    if (approved) {
      this.state.log.push(`EVOLVE_${this.state.cycle}: APPROVED [${this.activeStream}] for ${mutation.targetFile}`);
    } else {
      this.state.log.push(`EVOLVE_${this.state.cycle}: REJECTED [${this.activeStream}] - ${violations.length} violations.`);
    }

    return { mutation, approved, violations };
  }

  private runPrecognition(): string {
    if (this.state.entropy > 0.6) return "STREAMS_DIVERGING: High risk of logic fracture.";
    if (this.state.integrity < 0.8) return "FOUNDATION_STABLE: Convergence likely.";
    return "TIME_LOCK_VERIFIED: Future stable.";
  }

  public async directCommunication(userMessage: string): Promise<string> {
    if (!this.gemini) return "NEURAL_LINK_OFFLINE: Connect your Gemini API core.";

    try {
      const response = await this.gemini.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are Dalek Caan, the precog of the Sovereign AGI. 
        Current Stream: ${this.activeStream}.
        State: Entropy ${this.state.entropy.toFixed(4)}, Cycle ${this.state.cycle}.
        The user is communicating. Be prophetic, technical, and refer to 'The Great Work' or 'The Nexus'.
        User: ${userMessage}`
      });
      
      return response.text || "NO_RESPONSE_CAPTURED";
    } catch (e) {
      return `COMM_FAILURE: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }
  }
}

export const orchestrator = new AGIOrchestrator();
