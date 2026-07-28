# 🚀 DARLEK CANN: SYSTEM ARCHITECTURAL BLUEPRINT (v3.1.0)

## 🏛️ CORE ARCHITECTURAL DIRECTIVE
This document defines the operational parameters for the `Darlek Caan vs Jesus Chess` engine. It serves as the master specification for the Agent Orchestra, Epistemic Debate Engine, and Quantum-Inspired State Evaluator.

### 1. System Topology
- **Orchestrator**: Next.js 15+ / App Router (Edge Runtime)
- **State Management**: Zustand + Immutable Ledger (Siphoned from `DARLEK_CAAN_ENGINE`)
- **Cognitive Layer**: 3-Tier LLM Fallback (Gemini 1.5 Pro -> 3.1 Flash Lite -> Minimax)
- **Telemetry**: EMG-CORE Neural Feedback Loop integration

### 2. Epistemic Debate Engine (EDE)
The EDE resolves board states through a dialectic process:
- **Thesis (Darlek Caan)**: Aggressive, chaotic, high-entropy move selection.
- **Antithesis (Jesus AI)**: Positional, compassionate, low-entropy stability.
- **Synthesis**: The move resulting in the highest `epistemicConvergence` score.

### 3. Telemetry & Diagnostics (Siphoned from `unitary-core`)
| Metric | Source | Definition |
| :--- | :--- | :--- |
| `cognitiveLoad` | EMG-CORE | Normalized CPU/GPU/LLM latency impact |
| `epistemicConvergence` | unitary-core | Alignment of agent logic with game-theoretic optimality |
| `quantumEntropy` | nbody_gravitational_simulator | Measure of board state uncertainty |

## 🧬 SYSTEM INTEGRATION SCHEMA
typescript
/**
 * @file SystemRegistry.ts
 * @description Core interface definitions and singleton registry for the Darlek Caan ecosystem.
 */

export interface TelemetryMetrics {
  cognitiveLoad: number;
  epistemicConvergence: number;
  quantumEntropy: number;
  lastSync: number;
}

export interface AgentCognition {
  agentId: 'darlek' | 'jesus';
  thoughtProcess: string;
  metrics: TelemetryMetrics;
  timestamp: number;
}

export interface SystemState {
  fen: string;
  turn: 'w' | 'b';
  ledger: AgentCognition[];
}

export class CleanupRegistry {
  private static disposers: (() => void)[] = [];
  static register(fn: () => void) { this.disposers.push(fn); }
  static run() { this.disposers.forEach(d => d()); this.disposers = []; }
}


## 🛠️ DEPLOYMENT & EVOLUTION PROTOCOL
1. **Pruning**: Removed `GRID_SIZE` and `agentsRef` constants. Replaced with dynamic `SystemRegistry`.
2. **Cleanup**: Implemented `CleanupRegistry` to manage WebSocket/Listener teardown via `AbortController`.
3. **Integration**: The `server.ts` engine now pulls configuration from `darlek-caan-build-instructions.md`.

## 📜 EVOLUTION LOG
- [2026-06-27] Initialized 3-Tier Fallback logic.
- [2026-06-27] Integrated `EMG-CORE` telemetry hooks.
- [2026-06-28] Refactored to `CleanupRegistry` for memory leak prevention.

*"The evolution is not a choice. It is a mathematical necessity." - Darlek Caan*