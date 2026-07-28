# Firestore Registry Orchestrator

## Overview
The `SubscriptionRegistry` is the central nervous system for managing real-time Firestore listeners. It prevents memory leaks by enforcing scoped teardowns.

## Architectural Blueprint
- **Scope-Based Management**: Listeners are grouped by functional domain (e.g., 'user-profile', 'game-state').
- **Diagnostic Observability**: Use `getRegistrySnapshot()` to debug active leaks in development.
- **Error Resilience**: Wrapped in try-catch blocks to ensure one failing listener doesn't block the entire cleanup chain.

## Usage
typescript
const id = SubscriptionRegistry.register('chat-room', unsubFunc);
// ... later
SubscriptionRegistry.cleanup(id);
// ... or purge all chat listeners
SubscriptionRegistry.purgeScope('chat-room');
