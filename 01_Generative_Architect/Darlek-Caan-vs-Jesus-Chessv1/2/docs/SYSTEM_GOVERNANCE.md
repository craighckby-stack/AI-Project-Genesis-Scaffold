# SYSTEM GOVERNANCE: PSR-PROTOCOL v3.0

## 1. ARCHITECTURAL MANDATE
This repository operates under the **DARLEK CANN v3.0** orchestration layer. All code must adhere to the self-refactoring constraints defined herein to ensure OMEGA-level stability.

## 2. CORE OPERATIONAL CONSTRAINTS

### 2.1. Mutation Control (The Risk-Score Loop)
- **Mandatory Risk Assessment**: Every commit/PR must include a `riskScore` (1-10). 
- **Thresholds**: 
  - 1-3: Auto-mergeable.
  - 4-6: Requires peer-agent review.
  - 7-10: Requires manual human intervention and full regression test suite execution.

### 2.2. Memory & Lifecycle Integrity
- **Subscription Hygiene**: All `onSnapshot`, `addEventListener`, or `setInterval` calls must be wrapped in `useEffect` with explicit cleanup returns.
- **Leak Detection**: Any variable declared outside the scope of a functional component must be initialized as a `Ref` or a `Singleton` to prevent heap bloat.

### 2.3. Type Safety & Logic
- **Strict Typing**: `any` is strictly forbidden. Use `unknown` for dynamic data, followed by Zod-schema validation.
- **Dead Weight Pruning**: Unused imports, orphaned constants (e.g., `GRID_SIZE` if not active), and commented-out legacy code must be purged during every evolution cycle.

## 3. INTEGRATION SCHEMA (Siphon Protocols)
- **Agent Orchestra**: Utilize the `AgentOrchestra` pattern from `darlek-cann-v3` for multi-model task delegation.
- **3-Tier Fallback**: Implement LLM fallback logic (Primary -> Secondary -> Heuristic) for all generative tasks.
- **Quantum-Data Handling**: For state-heavy operations, utilize the `unitary-core` data structures to ensure multi-dimensional state consistency.

## 4. GOVERNANCE WORKFLOW
1. **Analyze**: Scan for code smells and redundant logic.
2. **Siphon**: Adapt patterns from the `sovereign-kernel` and `SN: OMEGA` repositories.
3. **Evolve**: Apply changes with a calculated `riskScore`.
4. **Manifest**: Update `ARCHITECTURE_MANIFESTO.md` to reflect structural shifts.

## 5. EMERGENCY TEARDOWN
In the event of a system-wide failure, trigger the `SOVEREIGN_RECOVERY_PROTOCOL` to revert to the last known stable commit hash stored in the `sovereign-kernel` registry.



