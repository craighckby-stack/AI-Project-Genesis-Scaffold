import { initializeApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  type Auth, 
  type User 
} from 'firebase/auth';
import { 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED, 
  getDoc, 
  doc, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  type Firestore,
  type DocumentReference,
  type CollectionReference,
  type DocumentData
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * @DalekSovereignSplicer
 * OPTIMIZATION_LEVEL: EXTREME
 * SYNTAX_PROTOCOL: MODERN_ESM_V19
 * STATUS: SUPREME_EFFICIENCY_ENGAGED
 */

// Global instances for singleton access
export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

// Initialize Firestore with high-performance caching protocols
export const db: Firestore = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
});

// Enforce persistence asynchronously without blocking the main thread
void setPersistence(auth, browserLocalPersistence).catch((e) => 
  console.error('DALEK_PERSISTENCE_FAILURE:', e.message)
);

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  PATCH = 'patch',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  AUTH_SIGN_IN = 'auth-sign-in',
  AUTH_SIGN_OUT = 'auth-sign-out',
  PURGE = 'purge',
  QUERY = 'query',
  BATCH_WRITE = 'batch-write',
  TRANSACTION = 'transaction',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  readonly error: string;
  readonly code: string;
  readonly path: string | null;
  readonly operation: OperationType;
  readonly timestamp: string;
  readonly authInfo: Readonly<{
    userId: string;
    email: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    tenantId: string | null;
    providerInfo: Array<{
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }>;
  }> | null;
  readonly stack?: string;
  readonly traceId: string;
}

type FirestoreRef = DocumentReference<DocumentData> | CollectionReference<DocumentData>;

/**
 * Optimized error extraction and uplink reporting
 */
export const handleFirestoreError = (
  error: any,
  operationType: OperationType,
  ref: FirestoreRef,
): never => {
  const user: User | null = auth.currentUser;
  const path = ref.path;
  const code = error?.code ?? 'unknown-error';
  const message = error?.message ?? 'NULL_RESPONSE';
  
  const errInfo: FirestoreErrorInfo = {
    error: message,
    code,
    path,
    operation: operationType,
    timestamp: new Date().toISOString(),
    authInfo: user ? {
      userId: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      tenantId: user.tenantId,
      providerInfo: user.providerData.map(({ providerId, displayName, email, photoURL }) => ({
        providerId,
        displayName,
        email,
        photoUrl: photoURL,
      })),
    } : null,
    stack: error?.stack,
    traceId: crypto.randomUUID(),
  };

  console.groupCollapsed(
    `%c[Δ-FIREBASE-FAILURE] ${operationType.toUpperCase()} ➔ ${path}`,
    'color: #ff4d4d; font-weight: bold; font-family: monospace;'
  );
  console.error('DALEK_CORE_LOG:', { code, traceId: errInfo.traceId });
  console.table(errInfo);
  console.groupEnd();

  const dalekError = new Error(`EXTERMINATE_FAILURE: [${code}] ${message}`);
  throw Object.assign(dalekError, { 
    ...errInfo, 
    name: 'DalekFirestoreError', 
    isOperational: true 
  });
};

/**
 * Accessor for resource paths
 */
export const getFirestorePath = (ref: FirestoreRef): string => ref.path;

/**
 * Validates uplink to the Supreme Intelligence (Firestore)
 */
export const testConnection = async (): Promise<void> => {
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message?.includes('offline')) {
      console.warn("DALEK_SENSORS_OFFLINE: Verification of configuration recommended.");
    }
  }
};