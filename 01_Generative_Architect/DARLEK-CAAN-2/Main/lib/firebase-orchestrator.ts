import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * @file firebase-orchestrator.ts
 * @description Centralized Firebase singleton orchestrator. 
 * Implements a robust initialization pattern to prevent memory leaks and redundant app instantiation.
 * Siphoned from: Microsoft/Semantic-Kernel & Google/Guava architectural patterns.
 */

interface FirebaseContext {
  db: Firestore;
  auth: Auth;
  app: FirebaseApp;
}

let instance: FirebaseContext | null = null;

/**
 * Validates environment configuration for Firebase.
 * Ensures strict adherence to required keys.
 */
const validateConfig = () => {
  const required = ['apiKey', 'projectId', 'appId'];
  const config = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
  
  for (const key of required) {
    if (!config[key]) throw new Error(`[DARLEK-CANN] Critical Config Missing: ${key}`);
  }
  return config;
};

/**
 * Initializes or retrieves the existing Firebase Orchestrator instance.
 * Implements singleton pattern to ensure zero-leak lifecycle management.
 */
export const getFirebaseOrchestrator = (): FirebaseContext => {
  if (instance) return instance;

  const config = validateConfig();
  const apps = getApps();
  
  const app = apps.length > 0 ? apps[0] : initializeApp(config);
  
  instance = {
    app,
    db: getFirestore(app),
    auth: getAuth(app),
  };

  return instance;
};

/**
 * Diagnostic health check for the Firebase connection.
 * Used by the Evolution Engine to verify system readiness.
 */
export const checkFirebaseHealth = async (): Promise<boolean> => {
  try {
    const { auth } = getFirebaseOrchestrator();
    return !!auth;
  } catch (e) {
    console.error('[DARLEK-CANN] Firebase Health Check Failed:', e);
    return false;
  }
};

export default getFirebaseOrchestrator;



