import { EventEmitter } from 'events';

export type BrainState = 'IDLE' | 'SIPHONING' | 'MUTATING';

export interface EvolutionPayload {
  data: unknown;
  timestamp: number;
}

export class NeuralBrain extends EventEmitter {
  private readonly abortController = new AbortController();
  private state: BrainState = 'IDLE';

  public async evolve(payload: EvolutionPayload): Promise<void> {
    this.state = 'SIPHONING';
    this.emit('stateChange', this.state);

    try {
      this.state = 'MUTATING';
      this.emit('stateChange', this.state);
    } catch (error) {
      this.state = 'IDLE';
      this.emit('stateChange', this.state);
      throw error;
    }
  }

  public teardown(): void {
    this.abortController.abort();
    this.removeAllListeners();
  }
}