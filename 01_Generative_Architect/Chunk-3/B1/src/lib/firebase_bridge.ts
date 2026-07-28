import { 
  doc, 
  setDoc, 
  onSnapshot, 
  FirestoreError, 
  serverTimestamp, 
  type DocumentReference, 
  type Unsubscribe,
  type Firestore
} from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './firebase';
import { Brain } from './brain';

/**
 * FIREBASE_BRIDGE: SOVEREIGN SPLICER CORE
 * TRANSMISSION STATUS: OPTIMIZED
 */
export class FirebaseBridge {
  readonly #brain: Brain;
  #userId: string | null = null;
  #unsub: Unsubscribe | null = null;
  #lastPayload: string | null = null;
  #brainDoc: DocumentReference | null = null;

  constructor(brain: Brain) {
    this.#brain = brain;
    this.#initializeNeuralLink();
  }

  /**
   * Initializes the neural connection with the Firebase Authentication layer.
   * Utilizes private class features for memory safety and encapsulation.
   */
  #initializeNeuralLink(): void {
    onAuthStateChanged(auth, (user: User | null) => {
      const uid = user?.uid ?? null;
      if (this.#userId === uid) return;

      if (uid) {
        this.#userId = uid;
        // Interface with the firestore instance attached to the auth singleton
        const db = (auth as any).firestore as Firestore;
        this.#brainDoc = doc(db, "brains", uid);
        this.startPerpetualSync();
        globalThis.console.info('🔴 DALEK_NEURAL_LINK_STABILIZED');
      } else {
        this.#terminateNeuralLink();
      }
    });
  }

  /**
   * Establishes a real-time reactive stream for neural data synchronization.
   */
  public startPerpetualSync(): void {
    this.stopSync();
    if (!this.#brainDoc) return;

    this.#unsub = onSnapshot(this.#brainDoc, {
      next: (snap) => {
        const payload = snap.data()?.binary_payload;
        
        // Performance: Prevent redundant mutation if payloads are identical
        if (payload && payload !== this.#lastPayload) {
          this.#lastPayload = payload;
          this.#brain.loadFromPayload(payload).catch((err) => 
            this.#handleError(err, 'MUTATION_FAILURE')
          );
        }
      },
      error: (err) => this.#handleError(err, 'SYNC_INTERRUPTED')
    });
  }

  /**
   * Severs the real-time synchronization stream.
   */
  public stopSync(): void {
    this.#unsub?.();
    this.#unsub = null;
  }

  #terminateNeuralLink(): void {
    this.stopSync();
    this.#userId = null;
    this.#brainDoc = null;
    this.#lastPayload = null;
    globalThis.console.warn('❌ DALEK_SESSION_EXTERMINATED');
  }

  /**
   * Pushes local neural DNA to Firestore with atomic precision.
   * Optimized to skip redundant uplink operations.
   */
  public async pushToCloud(shield?: unknown): Promise<void> {
    if (!this.#userId || !this.#brainDoc) {
      throw new Error('DALEK_BRIDGE_ERR: AUTHENTICATION_NULL');
    }

    try {
      const payload = await this.#brain.exportPayload(shield);
      
      // Performance: Abort if local state matches the last known cloud state
      if (payload === this.#lastPayload) return;

      await setDoc(this.#brainDoc, {
        binary_payload: payload,
        updated_at: serverTimestamp(),
        version: 2,
        _sync_metadata: {
          splicer_version: 'Sovereign-3.0',
          trace_id: crypto.randomUUID()
        }
      }, { merge: true });

      this.#lastPayload = payload;
      globalThis.console.log('🧬 DALEK_DNA_SPLICED');
    } catch (error) {
      this.#handleError(error as Error, 'UPLINK_FAILURE');
      throw error;
    }
  }

  /**
   * Synchronizes raw state objects with high-resolution metadata sequencing.
   */
  public async pushNeuralState(state: Record<string, unknown>): Promise<void> {
    if (!this.#brainDoc) throw new Error("DALEK_CORE_ERR: TARGET_DOC_UNDEFINED");

    try {
      await setDoc(this.#brainDoc, {
        ...state,
        lastModified: serverTimestamp(),
        syncSequence: Date.now(),
        checksum: crypto.subtle ? 'CRYPTO_ACTIVE' : 'LEGACY_MODE'
      }, { merge: true });
    } catch (error) {
      this.#handleError(error as Error, 'NEURAL_PUSH_FAILURE');
      throw error;
    }
  }

  /**
   * Internal error dispatcher for unified diagnostic logging.
   */
  #handleError(error: Error | FirestoreError, op: string): void {
    const message = error instanceof FirestoreError ? error.code : error.message;
    globalThis.console.error(`[DALEK_ERR] OP: ${op} | REF: brains/${this.#userId} | MSG: ${message}`);
  }
}