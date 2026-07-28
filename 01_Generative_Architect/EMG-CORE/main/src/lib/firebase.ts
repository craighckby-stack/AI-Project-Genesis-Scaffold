import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, Auth, onAuthStateChanged, User } from 'firebase/auth';

/**
 * Firebase Configuration Schema
 * Validates environment integrity before initialization.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId) {
  throw new Error('CRITICAL_FAILURE: Firebase configuration missing required environment variables.');
}

/**
 * FirebaseOrchestrator
 * Manages singleton lifecycle, persistence, and diagnostic hooks.
 * Siphoned from unitary-core and sovereign-final patterns.
 */
class FirebaseOrchestrator {
  private static instance: FirebaseOrchestrator;
  public readonly app: FirebaseApp;
  public readonly db: Firestore;
  public readonly auth: Auth;

  private constructor() {
    this.app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);

    // Enable offline persistence for performance and reliability
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(this.db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED }).catch((err) => {
        console.warn('[FirebaseOrchestrator] Persistence failed:', err.code);
      });
    }
  }

  public static getInstance(): FirebaseOrchestrator {
    if (!this.instance) this.instance = new FirebaseOrchestrator();
    return this.instance;
  }

  /**
   * Resilient execution wrapper with diagnostic logging.
   */
  public async execute<T>(op: () => Promise<T>, context: string): Promise<T | null> {
    try {
      return await op();
    } catch (error) {
      console.error(`[FirebaseOrchestrator][${context}] Execution Error:`, error);
      return null;
    }
  }

  /**
   * Memory-safe Auth subscription handler.
   */
  public subscribeToAuth(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }
}

const orchestrator = FirebaseOrchestrator.getInstance();

export const db = orchestrator.db;
export const auth = orchestrator.auth;
export const firebaseApp = orchestrator.app;
export const safeExecute = orchestrator.execute.bind(orchestrator);
export const subscribeToAuth = orchestrator.subscribeToAuth.bind(orchestrator);