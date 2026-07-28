export interface SystemException {
  code: string;
  message: string;
  correlationId: string;
  timestamp: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type Unsubscribe = () => void;