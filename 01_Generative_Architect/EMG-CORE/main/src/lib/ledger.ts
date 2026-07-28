import { db } from "./firebase";
import { collection, doc, addDoc, serverTimestamp, writeBatch, WriteBatch } from "firebase/firestore";

/**
 * @interface EvolutionEvent
 * @description Schema for immutable evolution tracking across the DARLEK-CAAN ecosystem.
 */
export interface EvolutionEvent {
  cycle: number;
  branch: string;
  commitSha: string;
  changes: string[];
  identityName: string;
  metadata?: Record<string, unknown>;
  status: 'COMMITTED' | 'FAILED' | 'ROLLBACK';
}

/**
 * @interface LedgerResponse
 * @description Standardized response for engine-level persistence operations.
 */
export interface LedgerResponse {
  success: boolean;
  id?: string;
  error?: unknown;
}

/**
 * @class LedgerController
 * @description Orchestrates cross-substrate persistence for evolution cycles. 
 * Integrated with Unitary-Core audit patterns for high-integrity state tracking.
 */
export class LedgerController {
  private static readonly COLLECTION_NAME = "evolution_history";

  /**
   * Records an evolution cycle with high-integrity metadata.
   */
  public static async logEvolutionCycle(event: EvolutionEvent): Promise<LedgerResponse> {
    try {
      const ledgerRef = collection(db, this.COLLECTION_NAME);
      const docRef = await addDoc(ledgerRef, {
        ...event,
        timestamp: serverTimestamp(),
        engine_version: "3.0.0",
        persistence_mode: "ATOMIC"
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("[Ledger] Critical Failure: Persistence lost.", error);
      return { success: false, error };
    }
  }

  /**
   * Batch processing for multi-agent evolution events.
   * Optimized to prevent memory leaks by utilizing scoped batching.
   */
  public static async logBatchCycles(events: EvolutionEvent[]): Promise<LedgerResponse> {
    if (events.length === 0) return { success: true };
    
    try {
      const batch: WriteBatch = writeBatch(db);
      events.forEach((event) => {
        const docRef = doc(collection(db, this.COLLECTION_NAME));
        batch.set(docRef, { 
          ...event, 
          timestamp: serverTimestamp(),
          batch_processed: true 
        });
      });
      await batch.commit();
      return { success: true };
    } catch (error) {
      console.error("[Ledger] Batch Persistence Failure:", error);
      return { success: false, error };
    }
  }
}

export default LedgerController;























