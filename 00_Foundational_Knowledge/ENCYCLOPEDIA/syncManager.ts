import fs from "fs";
import path from "path";

export interface SyncState {
  isRunning: boolean;
  statusMessage: string;
  processedRepos: string[];
  currentRepo: string | null;
  processedFilesInCurrentRepo: string[];
  totalFilesInCurrentRepo: number;
  rateLimitPauseUntil: number | null;
  error: string | null;
  isFinished: boolean;
}

const SYNC_STATE_FILE = path.join(process.cwd(), "sync_state.json");

export function loadSyncState(): SyncState {
  if (fs.existsSync(SYNC_STATE_FILE)) {
    return JSON.parse(fs.readFileSync(SYNC_STATE_FILE, "utf-8"));
  }
  return {
    isRunning: false,
    statusMessage: "Idle",
    processedRepos: [],
    currentRepo: null,
    processedFilesInCurrentRepo: [],
    totalFilesInCurrentRepo: 0,
    rateLimitPauseUntil: null,
    error: null,
    isFinished: false
  };
}

export function saveSyncState(state: SyncState) {
  fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2));
}

export let syncLoopActive = false;
export function setSyncLoopActive(active: boolean) {
  syncLoopActive = active;
}
