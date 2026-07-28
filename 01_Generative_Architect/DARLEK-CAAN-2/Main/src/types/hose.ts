export interface HarmonicState {
  readonly id: string;
  readonly position: number;
  readonly momentum: number;
  readonly timestamp: number;
  readonly entropy: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export type StateTransition = (current: HarmonicState) => HarmonicState;

export interface Disposable {
  unsubscribe: () => void;
}


