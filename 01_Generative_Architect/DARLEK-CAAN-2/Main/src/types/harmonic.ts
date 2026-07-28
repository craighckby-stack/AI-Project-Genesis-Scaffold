export interface HarmonicState {
  readonly position: number;
  readonly momentum: number;
  readonly timestamp: number;
  readonly entropy: number;
  readonly metadata: Record<string, unknown>;
}

export type StateTransition = (current: HarmonicState) => HarmonicState;



