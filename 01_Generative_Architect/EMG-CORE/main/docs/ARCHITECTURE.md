# DARLEK-CANN System Architecture: V3.0

## 1. Executive Summary
DARLEK-CANN is a self-evolving, autonomous code orchestration engine. It utilizes a 3-tier LLM fallback strategy, quantum-inspired state management, and a constraint-based consciousness framework (Z-AGI) to maintain system integrity while performing recursive code mutations.

## 2. Architectural Blueprint

### A. The Epistemic Core (Orchestration Layer)
- **Agent Orchestra**: Manages concurrent task execution across specialized sub-agents.
- **Constraint-Based Consciousness (Z-AGI)**: Enforces operational boundaries during autonomous evolution.
- **Circuit-Breaker Logic**: Implemented via `GeminiService` to prevent cascading failures during LLM latency spikes.

### B. Data & State Management
- **Quantum-State Store**: Utilizes immutable snapshots for rollbacks.
- **Memory Integrity Protocol**: 
  - All subscriptions (e.g., `onSnapshot`, `onAuthStateChanged`) are wrapped in `TeardownRegistry`.
  - Automated garbage collection of stale `agentsRef` and orphaned event listeners.

### C. Security & Ingestion
- **Sanitization Layer**: Helmet.js + RateLimiting + Epistemic Validation.
- **Evolution Guardrails**: Every mutation is verified against the `SPEC.md` schema before deployment.

## 3. Technical Workflow
1. **Ingestion**: Request enters via `Next.js` Edge Middleware.
2. **Epistemic Analysis**: The `DebateEngine` evaluates the request against current system state.
3. **Mutation**: `CodeEvolutionEngine` applies patches via AST manipulation.
4. **Validation**: Automated test suite (Spectest) validates the mutation.
5. **Teardown**: `TeardownRegistry` clears all volatile memory references.

## 4. System Integration Schema
| Module | Responsibility | Dependency |
| :--- | :--- | :--- |
| `DiagnosticLogger` | System Health Monitoring | `Winston` / `Pino` |
| `GeminiService` | LLM Fallback Orchestration | `Google-Generative-AI` |
| `EvolutionEngine` | AST Mutation & Pruning | `TypeScript` Compiler API |
| `TeardownRegistry` | Memory Leak Prevention | `Node.js` `process` hooks |

## 5. Deployment & Evolution
- **CI/CD**: Automated via `darlek-caan-build-instructions`.
- **Versioning**: Semantic evolution tracking linked to `sovereign-final` specifications.
