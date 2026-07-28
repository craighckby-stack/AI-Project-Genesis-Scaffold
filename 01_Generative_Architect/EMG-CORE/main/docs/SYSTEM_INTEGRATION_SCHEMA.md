# DARLEK CANN v3.0 — SYSTEM INTEGRATION SCHEMA

## 1. ARCHITECTURAL BLUEPRINT

This system operates on a **Tri-Tier Agentic Architecture**, siphoning design patterns from the `EMG-CORE` and `Sovereign-Final` frameworks. It utilizes a recursive feedback loop for code evolution and epistemic validation.

### 1.1 The Singularity Loop (Data Flow)
1.  **Ingestion Layer**: `InputBuffer` captures raw code or prompts. 
2.  **Epistemic Validation**: `EpistemicEngine` (Siphoned from `build_epistemic_debate_engine`) evaluates the input against constraint-based consciousness rules (`Z-AGI` framework).
3.  **Mutation Generation**: `MutationHash` is generated via the **3-Tier LLM Fallback**:
    - *Primary*: High-reasoning model (e.g., GPT-4o/Claude 3.5).
    - *Secondary*: Fast-inference model for validation.
    - *Tertiary*: Local/Edge model for basic syntax checking.
4.  **Orchestration**: `AgentOrchestrator` dispatches tasks to specialized sub-agents (Refactor, Documenter, Security, Optimizer).
5.  **State Synthesis**: `StateDelta` calculates the difference between current and evolved code.
6.  **Persistence & Sync**: `UI_Update` triggers React state transitions while `Firestore_Sync` ensures real-time multi-client consistency.

---

## 2. TECHNICAL WORKFLOWS

### 2.1 Code Evolution Pipeline
mermaid
graph TD
    A[Raw Code] --> B{Epistemic Filter}
    B -->|Valid| C[Mutation Engine]
    B -->|Invalid| D[Rejection Log]
    C --> E[Agent Orchestra]
    E --> F[Conflict Resolver]
    F --> G[Final StateDelta]
    G --> H[Firestore / UI]


### 2.2 Memory Leak Prevention (Dalek-Caan Cleanup Protocol)
To prevent memory leaks identified in previous iterations (e.g., `agentsRef` leaks), all subscriptions must follow the **Atomic Teardown Pattern**:

- **Nested Listeners**: If `onSnapshot` is invoked within an `onAuthStateChanged` block, the inner unsubscribe must be scoped and cleared independently of the outer listener.
- **Registry**: All active listeners must be stored in a `SubscriptionRegistry` for emergency global purging on `auth.signOut()`.

---

## 3. INTERFACE DECLARATIONS

typescript
/** Siphoned from DARLEK_CAAN_ENGINE types */

interface MutationPacket {
  id: string;
  timestamp: number;
  originHash: string;
  delta: string;
  authorAgent: "SUPREME_CONTROLLER" | "EVOLUTION_SUB_AGENT";
  epistemicScore: number; // 0.0 to 1.0
}

interface SystemState {
  agents: Map<string, AgentStatus>;
  activeMutations: MutationPacket[];
  gridConfig: { // Replaces dead-weight GRID_SIZE constants
    dimensions: [number, number];
    resolution: number;
  };
  isSyncing: boolean;
}


---

## 4. SYSTEM INTEGRATION SCHEMA

### 4.1 Firebase & Real-time Sync
- **Collection Structure**: `/evolutions/{evolutionId}/mutations`
- **Security Rules**: Siphoned from `Darlek-Caan-system-Deployment-`. Only authenticated `SUPREME_CONTROLLER` nodes can write to the `MutationHash` path.

### 4.2 UI/UX Integration (Tailwind + Next.js)
- **Theme**: High-contrast "Obsidian-Void" theme siphoned from `v2` (V2.html).
- **Components**: Atomic design components from `claud-ios` adapted for Next.js 14 Server Components.

---

## 5. CRITICAL CONSTRAINTS
1.  **No Dead Weight**: Any variable declared (e.g., `GRID_SIZE`, `agentsRef`) must be mapped to the `SystemState` or pruned during the build step.
2.  **Type Safety**: 100% TypeScript coverage. No `any` types allowed in the `EpistemicEngine` or `AgentOrchestrator` modules.
3.  **Recursive Evolution**: The system must be capable of analyzing its own `SYSTEM_INTEGRATION_SCHEMA.md` and proposing upgrades via the `MutationHash` pipeline.