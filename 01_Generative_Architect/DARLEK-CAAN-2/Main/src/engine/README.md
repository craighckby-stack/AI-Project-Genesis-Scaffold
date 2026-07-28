# AetherForge Engine Documentation

## Overview
The AetherForge engine is the core simulation controller for the prime-resonance world state. It manages real-time spatial updates and Firestore synchronization.

## Architecture
- **State Management**: Uses React refs for high-frequency simulation loops to prevent stale closure bugs.
- **Sync Protocol**: Implements a robust `onSnapshot` listener with explicit cleanup to prevent memory leaks.
- **Integration**: Designed to interface with `unitary-core` data structures.

## API
- `updateSimulation(w, h, dt)`: Advances the world clock and agent positions.
- `syncWorld()`: Persists current state to Firestore.
- `addEvent(msg, type)`: Injects system logs into the world state.






