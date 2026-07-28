# useAgentState Architectural Blueprint

## Overview
Part of the DARLEK CANN v3.0 core. Provides reactive, type-safe synchronization between Firestore agent documents and the UI layer.

## Workflow
1. **Initialization**: Hook triggers on `agentId` change.
2. **Subscription**: `onSnapshot` creates a persistent bidirectional-sync channel.
3. **Cleanup**: Automatic teardown on unmount or ID mutation to prevent memory leaks.
4. **Error Handling**: Integrated `FirestoreError` state for robust UI feedback.

## Integration
- **Next.js**: Optimized for Server-Side Rendering (SSR) compatibility.
- **Firebase**: Native Firestore integration.
- **TypeScript**: Strict generic typing for custom agent schemas.



