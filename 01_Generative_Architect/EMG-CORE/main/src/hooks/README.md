# Hooks Architecture: Core Identity Engine

## Overview
This module provides the `useCoreIdentity` hook, a reactive bridge between Firebase Firestore and the application state. It is designed for high-concurrency environments where identity state must remain consistent across multi-dimensional agent interactions.

## Architectural Blueprint
- **Lifecycle Management**: Utilizes `useRef` to maintain a persistent handle on Firestore `Unsubscribe` functions, preventing memory leaks.
- **State Consistency**: Implements a strict `loading -> data/null -> error` state machine.
- **Integration**: Designed to be consumed by the `AgentOrchestrator` to provide context-aware identity injection.

## Usage
typescript
const { identity, loading, error, refetch } = useCoreIdentity(uid, db);


## Integration Schema
- **Input**: `uid` (string | null), `db` (Firestore instance)
- **Output**: `UseCoreIdentityReturn` (Identity object, loading state, error state, manual sync trigger)
