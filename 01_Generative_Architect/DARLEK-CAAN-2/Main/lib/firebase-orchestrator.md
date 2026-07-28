# Firebase Orchestrator Blueprint

## Overview
The `firebase-orchestrator.ts` acts as the primary gateway for all Firebase interactions within the DARLEK CANN ecosystem. It enforces a singleton lifecycle to prevent redundant socket connections and memory leaks.

## Architectural Schema
- **Singleton Pattern**: Ensures `initializeApp` is called exactly once.
- **Environment Injection**: Configuration is strictly parsed from `FIREBASE_CONFIG` environment variables.
- **Health Monitoring**: Includes `checkFirebaseHealth` for integration with the Evolution Engine's diagnostic suite.

## Integration Workflow
1. Import `getFirebaseOrchestrator`.
2. Call the function to retrieve the `db` and `auth` handles.
3. Use the returned context for all agent-based data operations.



