export interface SystemManifest {
  manifest: { version: string; build_hash: string; last_sync: string; environment: string };
  system_architecture: { core_orchestrator: string; consciousness_framework: string; swarm_protocol: string; substrate_depth: number; memory_management: { limit_mb: number; strategy: string; leak_prevention: string } };
  runtime_hooks: { siphoned_modules: string[]; required_features: Record<string, string> };
  security_contracts: { governance: string; self_improvement_loop: string; ethical_framework: string; error_recovery: string };
  deployment_specs: { permissions: string[]; telemetry: { trace_level: string; heartbeat_ms: number } };
  metadata: { maintainer: string; license: string; keywords: string[] };
}




