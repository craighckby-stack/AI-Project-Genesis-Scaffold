# PlanetMap Telemetry Module

## 1. Architectural Blueprint
High-fidelity spatial telemetry engine designed for real-time world state visualization. Siphoned from `unitary-core` and `nbody_gravitational_simulator` architectures.

### 1.1 Projection Engine
- **Coordinate Mapping**: Normalized space [0, 1000] mapped to dynamic viewport via `ResizeObserver`.
- **Render Pipeline**: Decoupled `requestAnimationFrame` loop with explicit `AbortController` cleanup hooks to prevent memory leaks.
- **Telemetry Sync**: Real-time state injection via `WorldState` and `Agent` interfaces.

## 2. Interface Declarations
typescript
/**
 * Core Telemetry Contract
 * @interface PlanetMapProps
 */
export interface PlanetMapProps {
  world: WorldState;
  agents: Agent[];
  selectedAgentId: string | null;
  onAgentSelect: (id: string | null) => void;
  renderMode: '2D' | 'WEBGL';
}

export interface WorldState {
  dimensions: { width: number; height: number };
  gravityConstant: number;
  timestamp: number;
}


## 3. System Integration Schema
### 3.1 Lifecycle Management
- **Initialization**: Context must be initialized with `{ alpha: false }` for optimized GPU compositing.
- **Teardown**: All `onSnapshot` or `requestAnimationFrame` hooks must return a cleanup function to prevent dangling listeners.
- **Memoization**: Projection matrices are cached via `useMemo` to reduce CPU overhead during high-frequency updates.

### 3.2 Performance Constraints
| Metric | Target | Optimization Strategy |
| :--- | :--- | :--- |
| Frame Budget | < 16.6ms | OffscreenCanvas worker offloading |
| Memory Leak | Zero | WeakMap for agent metadata tracking |
| Sync Latency | < 50ms | SWR-based state revalidation |

## 4. Deployment Context
This module is a core component of the `Darlek-Cann-v3` ecosystem. It relies on `unitary-core` for gravitational calculations and `nbody_gravitational_simulator` for spatial indexing. Ensure `PlanetMap` is wrapped in an `ErrorBoundary` to isolate render-cycle failures.



