import { auth } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  type User, 
  type AuthCredential,
  type Unsubscribe 
} from 'firebase/auth';

/**
 * ⌬ DALEX_NEXUS_AUTH_PROTOCOLS
 * Refactored for elite performance, minimal footprint, and modern execution.
 */

interface AuthBridge {
  onAuthStateChange(callback: (user: User | null) => void): Unsubscribe;
  getCurrentUser(): User | null;
  login(): Promise<{ user: User; credential: AuthCredential | null }>;
  logout(): Promise<void>;
}

const ERROR_REGISTRY = Object.freeze({
  'auth/popup-closed-by-user': { level: 'warn', msg: '⌬ [AuthBridge] :: Sequence terminated: User closed the interface.' },
  'auth/popup-blocked': { level: 'error', msg: '⌬ [AuthBridge] :: Execution blocked: Popup prevented by host browser.' },
  'auth/cancelled-popup-request': { level: 'warn', msg: '⌬ [AuthBridge] :: Collision detected: Previous request neutralized.' },
  'auth/account-exists-with-different-credential': { level: 'error', msg: '⌬ [AuthBridge] :: Identity collision: Account exists under different provider.' },
  'auth/network-request-failed': { level: 'error', msg: '⌬ [AuthBridge] :: Transmission failure: Network link unstable.' },
} as const);

class AuthBridgeSovereign implements AuthBridge {
  static #instance: AuthBridgeSovereign;
  readonly #listeners = new Set<(user: User | null) => void>();
  readonly #provider = new GoogleAuthProvider();
  #user: User | null = null;
  #initialized = false;

  private constructor() {
    this.#setupProvider();
    this.#synchronize();
  }

  public static getInstance(): AuthBridgeSovereign {
    return (this.#instance ??= new AuthBridgeSovereign());
  }

  #setupProvider(): void {
    this.#provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    this.#provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    this.#provider.setCustomParameters({ prompt: 'select_account' });
  }

  #synchronize(): void {
    if (this.#initialized) return;

    onAuthStateChanged(
      auth,
      (user) => {
        this.#user = user;
        this.#broadcast(user);
      },
      (error) => console.error("⌬ AUTH_BRIDGE_CRITICAL_FAILURE:", error)
    );

    this.#initialized = true;
  }

  #broadcast(user: User | null): void {
    this.#listeners.forEach((callback) => {
      try {
        callback(user);
      } catch (e) {
        console.warn("⌬ SIGNAL_INTERRUPTION_NEUTRALIZED:", e);
      }
    });
  }

  public onAuthStateChange = (callback: (user: User | null) => void): Unsubscribe => {
    this.#listeners.add(callback);
    callback(this.#user);
    return () => {
      this.#listeners.delete(callback);
    };
  };

  public getCurrentUser = (): User | null => this.#user;

  public login = async (): Promise<{ user: User; credential: AuthCredential | null }> => {
    try {
      const result = await signInWithPopup(auth, this.#provider);
      if (!result.user) throw new Error("Σ_AUTH_VOID :: Identity context nullified.");
      
      return { 
        user: result.user, 
        credential: GoogleAuthProvider.credentialFromResult(result) 
      };
    } catch (error: any) {
      const entry = ERROR_REGISTRY[error.code as keyof typeof ERROR_REGISTRY];
      const { level, msg } = entry ?? { 
        level: 'error', 
        msg: `⌬ [AuthBridge] :: Unclassified protocol error [${error.code}].` 
      };
      console[level](msg);
      throw error;
    }
  };

  public logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("[DALEX_NEXUS_AUTH_ERROR]: Logout sequence failed.", error);
      throw error;
    } finally {
      this.#purgeLocalArtifacts();
    }
  };

  #purgeLocalArtifacts(): void {
    if (typeof window === 'undefined') return;
    const artifacts = ['firebase:host', 'auth_token', 'user_session'];
    for (const key of artifacts) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    sessionStorage.clear();
  }
}

export const authBridge = AuthBridgeSovereign.getInstance();