import { initializeApp, FirebaseApp, FirebaseOptions, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, Auth, UserCredential, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export enum FirebaseConnectionState {
  UNINITIALIZED = 'UNINITIALIZED',
  INITIALIZING = 'INITIALIZING',
  READY = 'READY',
  ERROR = 'ERROR',
  PERSISTENCE_ENABLED = 'PERSISTENCE_ENABLED'
}

export interface FirebaseDiagnostics {
  timestamp: number;
  status: FirebaseConnectionState;
  latencyMs?: number;
}

class FirebaseOrchestrator {
  private static instance: FirebaseOrchestrator;
  public readonly app: FirebaseApp;
  public readonly auth: Auth;
  public readonly db: Firestore;
  private state: FirebaseConnectionState = FirebaseConnectionState.UNINITIALIZED;
  private authUnsubscribe: (() => void) | null = null;

  private constructor() {
    const config = firebaseConfig as FirebaseOptions;
    const apps = getApps();
    this.app = apps.length === 0 ? initializeApp(config) : apps[0];
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  public static getInstance(): FirebaseOrchestrator {
    if (!FirebaseOrchestrator.instance) {
      FirebaseOrchestrator.instance = new FirebaseOrchestrator();
    }
    return FirebaseOrchestrator.instance;
  }

  public async initialize(): Promise<void> {
    if (this.state === FirebaseConnectionState.READY) return;
    
    this.state = FirebaseConnectionState.INITIALIZING;
    const start = performance.now();

    try {
      await enableIndexedDbPersistence(this.db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED }).catch(() => null);
      this.authUnsubscribe = onAuthStateChanged(this.auth, (user) => {
        if (!user) signInAnonymously(this.auth).catch(this.handleError);
      });
      
      this.state = FirebaseConnectionState.READY;
      this.logDiagnostics({ timestamp: Date.now(), status: this.state, latencyMs: performance.now() - start });
    } catch (error) {
      this.state = FirebaseConnectionState.ERROR;
      this.handleError(error);
    }
  }

  public teardown(): void {
    if (this.authUnsubscribe) this.authUnsubscribe();
    this.state = FirebaseConnectionState.UNINITIALIZED;
  }

  private handleError(error: unknown): void {
    console.error('[DARLEK-CANN] Firebase Critical Failure:', error);
  }

  private logDiagnostics(diag: FirebaseDiagnostics): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[DARLEK-CANN] System Status:', diag);
    }
  }

  public getState(): FirebaseConnectionState { return this.state; }
}

const orchestrator = FirebaseOrchestrator.getInstance();
export const { app, auth, db } = orchestrator;
export const initializeFirebase = () => orchestrator.initialize();
export const terminateFirebase = () => orchestrator.teardown();
export default orchestrator;



























