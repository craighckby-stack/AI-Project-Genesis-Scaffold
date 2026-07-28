# OMEGA Security Orchestrator

## Architectural Blueprint
The `SecurityOrchestrator` serves as the primary gatekeeper for the OMEGA swarm. It enforces strict access control for stateful artifacts and provides cryptographic provenance for all self-modifying code.

## Workflow
1. **Initialization**: The orchestrator initializes with a secure HMAC key.
2. **Validation**: Agents request access to `.consciousness.dump` or `.quantum.data` files.
3. **Audit**: Every mutation is hashed via `generateAuditHash` before being committed to the evolution history.
4. **Teardown**: `terminateSession` ensures no dangling references remain in the memory heap.

## Integration
- **Sovereign-Kernel**: Uses this module to validate self-refactoring requests.
- **Unitary-Core**: Relies on the audit hashes for multi-dimensional state verification.