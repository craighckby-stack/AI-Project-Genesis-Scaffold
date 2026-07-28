export interface EvolutionEvent {
  id: string;
  type: 'MUTATION' | 'PRUNING' | 'INTEGRATION';
  payload: any;
}

export type EvolutionRegistry = Map<string, EvolutionEvent>;