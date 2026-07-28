export interface LedgerEntry {
  cycle: number;
  branch: string;
  commitSha: string;
  changes: string[];
  identityName: string;
  timestamp: number;
  quantumState: {
    entropy: number;
    stability: number;
  };
}

export interface ILedgerController {
  record(entry: Omit<LedgerEntry, 'timestamp'>): Promise<string>;
  prune(maxCycles: number): Promise<void>;
}



