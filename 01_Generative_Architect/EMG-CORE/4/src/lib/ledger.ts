import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * CROSS-SUBSTRATE LEDGER: Maintains an immutable log of evolution cycles outside 
 * of the target repository context.
 */
export async function logEvolutionCycle(params: {
  cycle: number;
  branch: string;
  commitSha: string;
  changes: string[];
  identityName: string;
}) {
  try {
    const ledgerRef = collection(db, "evolution_history");
    await addDoc(ledgerRef, {
      ...params,
      timestamp: serverTimestamp(),
      type: "PERSISTENCE_LEDGER",
      status: "COMMITTED"
    });
    console.log(`[Ledger] Cycle ${params.cycle} recorded in cross-substrate persistence.`);
  } catch (error) {
    console.error("[Ledger] Failed to record evolution cycle:", error);
    // Non-blocking failure for leadger - the repo mutation is primary.
  }
}
