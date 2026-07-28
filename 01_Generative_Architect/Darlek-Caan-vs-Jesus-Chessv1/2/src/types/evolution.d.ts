export interface MutationManifest {
  timestamp: string;
  version: string;
  entropyLevel: number;
  appliedConstraints: string[];
  systemState: 'CHAOTIC' | 'REDEMPTIVE';
}

export interface ForgeAgent {
  id: string;
  theologicalState: string;
  alignmentScore: number;
}




