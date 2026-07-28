# DARLEK CANN V3.0: OMEGA-KERNEL ARCHITECTURAL SPECIFICATION

## 1. CORE ARCHITECTURAL DIRECTIVES
- **Paradigm**: Immutable Build-Time Configuration (IBTC) & Reactive State Synchronization.
- **Orchestration**: Next.js 14+ App Router + Vite-Powered Edge Runtime.
- **Type Safety**: Strict TSConfig (No-Implicit-Any, Exact-Optional-Property-Types, StrictNullChecks).
- **Telemetry**: Real-time injection of `__BUILD_HASH__`, `__AGENT_VERSION__`, and `__NODE_ENV__` via `vite.config.ts`.

## 2. SYSTEM INTEGRATION SCHEMA (Siphoned from `unitary-core` & `graphrag`)
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Orchestrator** | Vercel AI SDK | Agentic LLM Flow Control & Swarm Coordination |
| **Storage** | LevelDB/RocksDB | Persistent Key-Value State for Agent Memory |
| **Runtime** | Node.js / Edge | High-Concurrency Execution & Stream Processing |
| **Validation** | Zod | Schema-First Data Integrity & Runtime Type Guards |
| **Documentation** | LangExtract | Automated RAG-ready JSON-LD generation from MD |

## 3. BUILD PIPELINE (Siphoned from `turborepo` & `sovereign-kernel`)
1. **Pre-Flight**: `vite-plugin-checker` validates type-integrity against `unitary-core` definitions.
2. **Siphoning**: `langextract` processes documentation into structured JSON-LD for agent RAG.
3. **Minification**: ESBuild-optimized tree-shaking for zero-dead-weight deployment.
4. **Chunking**: Manual vendor-splitting for `agent-orchestrator` and `ui-primitives` to minimize cold-start latency.

## 4. ENVIRONMENT PARITY & ALIASING (TSConfig Mapping)
- `@/core/*` -> `src/core` (Kernel Logic & State Machines)
- `@/agents/*` -> `src/agents` (Swarm Logic & LLM Handlers)
- `@/lib/*` -> `src/lib` (Shared Utilities & Cryptographic Helpers)
- `@/types/*` -> `src/types` (Global Interface Definitions)

## 5. DIAGNOSTIC TELEMETRY & METADATA
- **Build Time**: `process.env.BUILD_TIME` (ISO-8601)
- **System State**: `process.env.NODE_ENV` (Production/Development/Test)
- **Version**: `package.json` -> `__APP_VERSION__` (SemVer 3.0.0+)
- **Registry**: All active agents must register via `src/core/registry.ts` to prevent memory leaks in the swarm.

## 6. EVOLUTIONARY PATH & GOVERNANCE
This file is the root node for the `darlek-cann-v3` build process. 
- **Constraint**: Any modification to the `BUILD_PIPELINE` requires a re-validation of the `unitary-core` dependency graph.
- **Cleanup Protocol**: All `onSnapshot` or `useEffect` subscriptions must be returned via a `cleanup` function to prevent memory leaks in the agent swarm.
- **Documentation Policy**: Every new module must include a `README.md` generated via `markitdown` patterns to ensure cross-repo compatibility.




