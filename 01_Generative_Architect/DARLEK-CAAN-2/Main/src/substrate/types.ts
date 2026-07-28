export type SubstrateEvent = 'STATE_CHANGE' | 'ENTROPY_SPIKE' | 'INTEGRITY_LOSS';
export interface SubstrateEventPayload {
    type: SubstrateEvent;
    timestamp: number;
    metadata: Record<string, any>;
}




