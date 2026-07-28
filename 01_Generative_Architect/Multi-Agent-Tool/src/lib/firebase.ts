import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth, signInAnonymously } from "firebase/auth";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export async function initializeFirebase(config: any) {
  if (getApps().length === 0) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }
  db = getFirestore(app);
  auth = getAuth(app);
  
  try {
    // Sign in anonymously for session tracking and persistence
    await signInAnonymously(auth);
  } catch (error) {
    console.warn("Firebase Anonymous Auth failed, falling back to local storage", error);
  }
  
  return { app, db, auth };
}

export function getDb(): Firestore | null {
  return db;
}

export function getAuthClient(): Auth | null {
  return auth;
}
