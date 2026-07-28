export interface SystemManifest {
  manifest: { name: string; version: string; build_timestamp: string; architecture: Record<string, string> };
  security: { protocol: string; governance: string; self_healing: boolean };
  modules: Record<string, { enabled: boolean; [key: string]: any }>;
  orchestration: { auto_refactor: boolean; fallback_strategy: string; dependency_graph: Record<string, string[]> };
  runtime_constraints: { max_memory_mb: number; max_agent_threads: number; strict_mode: boolean };
}

export const validateManifest = (manifest: SystemManifest): boolean => {
  return !!manifest.manifest.version && manifest.runtime_constraints.strict_mode;
};