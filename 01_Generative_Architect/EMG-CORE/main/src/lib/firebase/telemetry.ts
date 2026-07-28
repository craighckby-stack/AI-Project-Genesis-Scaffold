import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const logTelemetry = async (appId: string, data: any) => {
  const ref = doc(db, `artifacts/${appId}/telemetry`, Date.now().toString());
  await setDoc(ref, { ...data, timestamp: serverTimestamp() });
};