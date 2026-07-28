/**
 * DARLEK CANN EVOLVED METADATA SCHEMA
 * Version: 4.0.0-OMEGA
 * 
 * This schema defines the core architectural blueprint for self-evolving systems,
 * integrating multi-agent orchestration, quantum-inspired data processing,
 * and autonomous governance protocols.
 */

export type SystemArchitecture = 'Next.js-Agent-Orchestra' | 'Quantum-Core' | 'Distributed-Swarm' | 'Z-AGI-Constraint';
export type SecurityLevel = 'OMEGA' | 'ALPHA-SHIELD' | 'PSR-COMPLIANT' | 'ZERO-TRUST';
export type FallbackTier = 'LLM-PRIMARY' | 'LLM-SECONDARY' | 'DETERMINISTIC-RECOVERY';

export interface AgentCapability {
  id: string;
  role: string;
  autonomyLevel: number; // 0.0 to 1.0
  tools: string[];
  memoryDepth: 'ephemeral' | 'persistent' | 'quantum';
}

export interface SystemMetadata {
  system: {
    name: string;
    version: string;
    architecture: SystemArchitecture;
    securityProtocol: SecurityLevel;
    description: string;
    kernelVersion: string;
    evolutionaryState: 'stable' | 'mutating' | 'optimizing';
  };
  
  capabilities: {
    primary: string;
    secondary: string[];
    agentSwarm: {
      enabled: boolean;
      orchestrator: string;
      agents: AgentCapability[];
    };
    integration: {
      framework: string;
      stateManagement: string;
      styling: string;
      apiLayer: 'GraphQL' | 'TRPC' | 'REST-Evolved';
    };
  };

  orchestration: {
    autoRefactor: {
      enabled: boolean;
      frequency: 'real-time' | 'on-commit' | 'scheduled';
      intensity: number; // 1-10
    };
    telemetry: {
      enabled: boolean;
      sink: string;
      metrics: ('latency' | 'token-usage' | 'mutation-success' | 'entropy')[];
    };
    fallback: {
      strategy: FallbackTier;
      autoSwitch: boolean;
      threshold: number; // Error rate threshold
    };
  };

  governance: {
    compliance: string;
    lastAudit: string;
    psrFramework: {
      policyId: string;
      enforcementMode: 'strict' | 'permissive';
      selfModificationRights: boolean;
    };
    auditLogRef: string;
  };

  quantumMetrics?: {
    entanglementDensity: number;
    coherenceTime: number;
    dimensionalAnalysis: string[];
  };
}

export const DEFAULT_SYSTEM_METADATA: SystemMetadata = {
  system: {
    name: "DARLEK CANN v3.0",
    version: "3.0.0",
    architecture: "Next.js-Agent-Orchestra",
    securityProtocol: "OMEGA",
    description: "Code evolution orchestrator with 3-tier LLM fallback.",
    kernelVersion: "v86-sovereign",
    evolutionaryState: "optimizing"
  },
  capabilities: {
    primary: "Autonomous Code Mutation",
    secondary: ["Architectural Siphoning", "Dead-weight Pruning", "Type-safe Transpilation"],
    agentSwarm: {
      enabled: true,
      orchestrator: "CANN-Controller",
      agents: []
    },
    integration: {
      framework: "Next.js 14",
      stateManagement: "Zustand-Quantum",
      styling: "TailwindCSS",
      apiLayer: "TRPC"
    }
  },
  orchestration: {
    autoRefactor: {
      enabled: true,
      frequency: "real-time",
      intensity: 8
    },
    telemetry: {
      enabled: true,
      sink: "/api/telemetry",
      metrics: ["mutation-success", "entropy"]
    },
    fallback: {
      strategy: "LLM-PRIMARY",
      autoSwitch: true,
      threshold: 0.05
    }
  },
  governance: {
    compliance: "ISO-DARLEK-9001",
    lastAudit: new Date().toISOString(),
    psrFramework: {
      policyId: "PSR-V1",
      enforcementMode: "strict",
      selfModificationRights: true
    },
    auditLogRef: "logs/governance.json"
  }
};



