# System Architecture: DARLEK CANN v4.0 (Omega-Core)

## 1. Executive Overview
DARLEK CANN v4.0 is a self-evolving orchestration framework for high-frequency multi-agent debate. It integrates the **Multi-Dimensional State Vector (MDSV)** with the **Temporal Prophecy Engine (TPE)**, governed by the **PSR-Governance Kernel** and a **3-Tier LLM Fallback Pipeline**. This architecture is designed for autonomous self-refactoring, drawing from `sovereign-v86` and `unitary-core` specifications.

## 2. System Topology
mermaid
graph TD
    UI[Next.js 15 / Tailwind] --> MDSV[Multi-Dimensional State Vector]
    MDSV --> TPE[Temporal Prophecy Engine]
    TPE --> PSR[PSR Governance Kernel]
    PSR --> LLM[3-Tier LLM Pipeline]
    PSR --> SELF[Self-Refactoring Loop]


## 3. Core Subsystems
### 3.1. Multi-Dimensional State Vector (MDSV)
Replaces static state with a quantum-inspired vector space. Manages dialectic tension between **Node Caan** (Deterministic, Temp: 0.15) and **Node Jesus** (Probabilistic, Temp: 0.85).

### 3.2. Temporal Prophecy Engine (TPE)
Calculates convergence via: $\Delta P = \eta \cdot \ln(1 + \text{Intensity}) \cdot e^{-\lambda \cdot t}$.

### 3.3. PSR-Governance Kernel
- **Entropy Threshold**: Execution halts if `entropyScore > 0.95`.
- **Self-Modification**: Monitors system drift; triggers `reconcile()` on state divergence.

### 3.4. 3-Tier LLM Fallback Pipeline
1. **Tier 1 (Frontier)**: Claude-3.5-Sonnet / GPT-4o.
2. **Tier 2 (Resilient)**: DeepSeek-V3 / Gemini-1.5-Pro.
3. **Tier 3 (Local Edge)**: Ollama (Llama-3-8B) for zero-offline failure.

## 4. Interface Declarations
typescript
export type NodeIdentity = 'CAAN' | 'JESUS';

export interface IDebateMessage {
  id: string;
  sender: NodeIdentity;
  content: string;
  entropyScore: number; // Siphoned from unitary-core
  timestamp: number;
}

export interface ISystemState {
  isDebating: boolean;
  activeNode: NodeIdentity;
  messages: IDebateMessage[];
  prophecyLevel: number;
  governanceStatus: 'STABLE' | 'DRIFTING' | 'CRITICAL';
}


## 5. Lifecycle Integrity (Dual-Teardown Pattern)
To prevent memory leaks in high-frequency state updates, all subscribers MUST implement the **Dual-Teardown Pattern**:

typescript
useEffect(() => {
  const controller = new AbortController();
  const unsubDebate = subscribeToDebateState(state => update(state));
  const unsubProphecy = subscribeToProphecyLevel(level => update(level));

  return () => {
    controller.abort();
    unsubDebate();
    unsubProphecy();
  };
}, []);


## 6. Security & Self-Improvement
- **State Persistence**: Zustand with `persist` middleware for cross-session prophecy tracking.
- **Refactoring Loop**: The system periodically executes `self-refactor.ts` to prune dead code and optimize dependency injection paths.




