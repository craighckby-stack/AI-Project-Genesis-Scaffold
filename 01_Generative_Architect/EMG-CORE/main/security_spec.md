# Security Architecture Blueprint: EMG Core Identity System (v3.0)

## 1. Systemic Invariant Enforcement (SIE)
All operations must pass through the `IdentityGatekeeper` middleware. The system operates on a zero-trust, immutable-core paradigm.

### Core Invariants
- **Identity Isolation**: `request.auth.uid == resource.data.ownerId` (Strict 1:1 mapping).
- **Immutable Identity**: `name` is hard-coded to "EMG Core". Any modification attempt triggers a `SECURITY_VIOLATION_LOG` and immediate session revocation.
- **Schema Integrity**: `learningLog`, `evolutionHistory`, and `insightConnections` are strictly typed via `Zod`. Type-coercion attempts are rejected at the edge.
- **Principle Evolution**: `principles` are strictly managed by the `EvolutionEngine` service account. Client-side requests for modification are ignored by the `Gatekeeper`.

## 2. Threat Vector Matrix (Hardened)
| Vector | Mitigation Strategy | Severity | Status |
| :--- | :--- | :--- | :--- |
| Identity Spoofing | Auth-Context Binding (JWT/Firebase) | Critical | Active |
| Shadow Field Injection | Strict Schema Whitelisting | High | Active |
| Core Name Hijack | Immutable Field Constraint | Critical | Active |
| Principle Deletion | Server-Side Validation Gates | High | Active |
| Log Erasure | Append-Only Audit Trail (WORM) | Medium | Active |
| Connection Poisoning | Graph-based Referential Integrity | Medium | Active |
| Unauthorized Get | Row-Level Security (RLS) | Critical | Active |
| Type Mismatch | Zod/TypeScript Schema Validation | Medium | Active |

## 3. Architectural Integration & Orchestration
- **Agent Orchestra**: Security events are piped to the `DARLEK_CANN_ENGINE` via `EventEmitter` for real-time anomaly detection and automated response.
- **Quantum Integrity**: `insightConnections` are validated against a graph-based integrity check (siphoned from `unitary-core`) to prevent cyclic or orphaned pointers.
- **State Management**: Integrated with `Next.js` Server Actions. Client-side logic is prohibited from direct database access; all mutations must pass through `src/lib/actions/secure-mutation.ts`.

## 4. Implementation Reference & Security Hooks
- **Validation Engine**: `src/lib/security/gatekeeper.ts` (Middleware pattern)
- **Schema Definition**: `src/types/identity.schema.ts` (Zod-based)
- **Anomaly Detection**: `src/lib/engine/anomaly-detector.ts` (Orchestra hook)
- **Test Suite**: `tests/security/integrity.test.ts` (Utilizing `firebase-rules-unit-testing` and `jest`)

## 5. Emergency Teardown Protocol (ETP)
In the event of a detected breach (Severity: Critical), the `IdentityGatekeeper` executes the following sequence:
1. **`revokeSession()`**: Invalidates all active JWTs.
2. **`flushCache()`**: Wipes local `Zustand` or `Redux` state stores.
3. **`isolateNode()`**: Triggers a network-level block on the offending UID.
4. **`logBreach()`**: Writes to WORM storage for forensic analysis.

## 6. Security Lifecycle & Compliance
- **Continuous Audit**: Every deployment triggers a `security-check` CI/CD pipeline.
- **Dependency Scanning**: `npm audit` integrated with `DARLEK_CANN_ENGINE` to prune vulnerable packages.
- **Evolutionary Drift**: Any code change that alters the `SIE` (Section 1) requires a manual sign-off from the `EvolutionEngine` service account.