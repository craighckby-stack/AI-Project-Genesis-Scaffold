/// <reference types="vite/client" />

/**
 * DARLEK CANN v3.0 - GLOBAL TYPE DEFINITION SYSTEM
 * Orchestrates environment safety, agent interfaces, and system-wide diagnostic schemas.
 */

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_AGENT_ORCHESTRATION_MODE: 'autonomous' | 'supervised' | 'quantum';
  readonly VITE_LLM_FALLBACK_LEVEL: '1' | '2' | '3';
  readonly VITE_DEBUG_MODE: 'true' | 'false';
  readonly VITE_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Global augmentation for the Agent Orchestra framework
 * Siphoned from unitary-core and darlek-cann-v3 architecture.
 */
export interface AgentContext {
  id: string;
  status: 'active' | 'dormant' | 'recalibrating';
  latency: number;
  lastSync: number;
}

declare global {
  interface Window {
    __DARLEK_SYSTEM_DIAGNOSTICS__: {
      version: string;
      uptime: number;
      activeAgents: AgentContext[];
    };
  }

  namespace NodeJS {
    interface ProcessEnv extends ImportMetaEnv {}
  }
}

export {};























