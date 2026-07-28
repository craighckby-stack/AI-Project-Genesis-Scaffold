export interface FirebaseEvent {
  type: 'CONNECTION_CHANGE' | 'AUTH_CHANGE' | 'ERROR';
  payload: any;
  timestamp: number;
}

export type FirebaseCallback = (event: FirebaseEvent) => void;




