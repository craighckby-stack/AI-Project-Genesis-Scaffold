# Security Manifest: DARLEK CANN v3.0

## Architecture
- **Zero-Trust Enforcement**: Default deny on all paths.
- **Temporal Integrity**: Monotonic timestamp validation for all simulation state updates.
- **Quantum Locking**: Immutable state protection for critical agent nodes.

## Integration
- Siphoned from: `sovereign-kernel`, `epistemic_debate_engine`.
- Compliance: Firebase Security Rules v2.

## Workflow
1. Authenticate via Firebase Auth.
2. Validate schema via `isValidAgent` / `isValidDebate`.
3. Verify ownership via `isOwner`.
4. Execute state transition only if `isMonotonic` holds true.




