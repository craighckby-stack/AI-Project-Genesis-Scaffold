export interface QuantumMetadata {
  readonly id: string;
  readonly createdAt: number;
  readonly origin: 'DARLEK_CANN_V3';
}

export type QuantumAction<T> = (prev: T) => T;