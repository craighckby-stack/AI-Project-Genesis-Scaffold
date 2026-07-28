# DARLEK CANN v3.0: SYSTEM EVOLUTION MANIFESTO

## 1. ARCHITECTURAL BLUEPRINT (Siphoned from `unitary-core` & `darlek-cann-v3`)
This system operates as a **3-Tier Agent Orchestra**. It enforces strict separation between the Logic Core, the Agentic Layer, and the Simulation Environment.

### Tiered Execution Schema
- **Tier 1: Logic Core (`@core`)**: Handles state reconciliation, quantum data processing, and evolution controller logic.
- **Tier 2: Agentic Layer (`@agents`)**: Manages multi-dimensional LLM fallback handlers and autonomous task execution.
- **Tier 3: Simulation Environment (`@sim`)**: Executes N-body gravitational simulations and epistemic debate engines.

## 2. TECHNICAL WORKFLOW & HARDENING
- **Strict Type Enforcement**: `tsconfig.json` is configured with `noUnusedLocals: true`, `noUnusedParameters: true`, and `strict: true`. 
- **Memory Leak Protocol**: All `onSnapshot` or `useEffect` listeners MUST return an explicit cleanup function. Nested subscriptions are forbidden unless wrapped in a `CompositeUnsubscribe` pattern.
- **Metadata Reflection**: Decorators are enabled for AGI agent registration and dependency injection.

## 3. INTEGRATION SCHEMA (Portfolio Siphoning)
| Module | Source Pattern | Integration Purpose |
| :--- | :--- | :--- |
| `@core` | `sovereign-final` | Immutable state management and system sovereignty. |
| `@agents` | `darlek-cann-v3` | Multi-tier LLM fallback and orchestration. |
| `@sim` | `nbody_gravitational_simulator` | High-fidelity spatial/epistemic environment simulation. |
| `@z` | `z-framework` | Constraint-based consciousness logic for AGI decision trees. |

## 4. COMBAT CODE SMELLS (Evolution Directives)
- **Pruning**: Any constant not actively driving state (e.g., legacy `GRID_SIZE`) is moved to `@shared/constants.ts` or purged.
- **Redundancy**: Duplicate logic blocks are unified into `@core/utils/evolution.ts`.
- **Leak Prevention**: Use `AbortController` for all asynchronous fetch operations. 

## 5. DEPLOYMENT & EVOLUTION
To evolve the system, execute the `DARLEK_CANN_ENGINE` build pipeline. Ensure all new modules adhere to the `ClaudIOS` system book standards for documentation and type safety.