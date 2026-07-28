export interface ReflectionLog {
  timestamp: string;
  analysis: string;
  utilityScore: number;
}

export interface SystemGraph {
  nodes: string[];
  dependencies: Map<string, string[]>;
}




