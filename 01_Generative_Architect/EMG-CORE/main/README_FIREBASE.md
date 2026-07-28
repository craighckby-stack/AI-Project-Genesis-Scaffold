# Firebase Orchestration Layer: DARLEK CANN v3.0

## 1. Architectural Blueprint
The Firebase Orchestration Layer acts as the primary data-persistence and state-synchronization bridge for the DARLEK CANN ecosystem. It enforces a singleton pattern to prevent HMR-induced memory leaks and provides a hardened wrapper for asynchronous operations.

### Core Components
- **Orchestrator Singleton**: Ensures a single `FirebaseApp` instance across the lifecycle.
- **Safe-Execution Wrapper**: Implements a centralized error-boundary for all Firestore/Auth operations.
- **Lifecycle Manager**: Handles automatic cleanup of `onSnapshot` and `onAuthStateChanged` subscriptions.

## 2. System Integration Schema

typescript
// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = { /* ... */ };

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Hardened execution wrapper for Firebase operations.
 * Prevents unhandled rejections and provides telemetry hooks.
 */
export async function safeExecute<T>(fn: () => Promise<T>, opName: string): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[DARLEK_CANN_ERR][${opName}]:`, error);
    return null;
  }
}


## 3. Lifecycle & Memory Management
To prevent memory leaks in React components, all listeners must implement the `Unsubscribe` pattern. 

### Pattern: Subscription Cleanup
typescript
useEffect(() => {
  const unsubscribe = onSnapshot(docRef, (snap) => { /* ... */ });
  return () => unsubscribe(); // Critical: Prevents dangling listeners
}, [docRef]);


## 4. Environment Validation
Strict validation is enforced via `process.env` checks on startup. If mandatory keys are missing, the system will throw a `CRITICAL_BOOT_FAILURE` exception to prevent partial state initialization.

## 5. Portfolio Integration
- **Agent Orchestra**: This layer provides the persistence backend for the `AgentState` objects defined in `unitary-core`.
- **Epistemic Debate Engine**: Utilizes the `safeExecute` pattern to log debate state transitions to Firestore.
- **N-Body Simulator**: Uses the optimized `getDoc` batching logic defined in the `DARLEK_CAAN_ENGINE` specifications.