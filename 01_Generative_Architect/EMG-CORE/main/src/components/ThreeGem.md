# ThreeGem: Quantum Visualization Engine (v3.0-CANN)

## 1. Architectural Blueprint
The `ThreeGem` component is the primary telemetry interface for the DARLEK CANN system. It provides a high-fidelity, reactive visualization layer that maps abstract `EvolutionPhase` states and quantitative substrate metrics into a 3D-simulated SVG coordinate space.

## 2. System Integration Schema
### Inputs
- `evolutionPhase`: `Enum<INITIALIZATION | MUTATION | STABILIZATION | SINGULARITY>`
- `substrateCount`: `number` (Clamped: 0 - 1000)
- `quantumFlux`: `number` (Normalized variance for jitter effect)

### Output
- `SVGElement`: A layered, reactive visual node with CSS-in-JS animation hooks.

## 3. Technical Workflow & Telemetry Pipeline
1. **Ingestion**: The `useTelemetry` hook subscribes to the `unitary-core` data stream.
2. **Normalization**: Metrics are passed through a `clampedLinear` function to derive `coreRadius` and `rotationSpeed`.
3. **State Mapping**: The `EvolutionPhase` triggers specific Tailwind animation classes (e.g., `animate-spin-slow` for STABILIZATION, `animate-pulse-fast` for SINGULARITY).
4. **Cleanup**: The component implements a `useEffect` teardown pattern to clear animation frames and prevent memory leaks during rapid state transitions.

## 4. Performance Constraints
- **Frame Budget**: 16.6ms per update (60fps target).
- **Memory Management**: All `onSnapshot` listeners must be explicitly unsubscribed via `useEffect` cleanup functions.
- **Dependency Injection**: Use `ThreeGemProvider` to inject global state variables from `DARLEK_CAAN_ENGINE`.

## 5. Interface Declaration
typescript
interface ThreeGemProps {
  phase: EvolutionPhase;
  metrics: {
    substrateCount: number;
    quantumFlux: number;
  };
  onInteraction?: (data: InteractionPayload) => void;
}


## 6. Project Portfolio Context
This component is designed to be compatible with:
- `unitary-core`: For quantum data processing.
- `nbody_gravitational_simulator`: For orbital path calculations.
- `sovereign-final`: For system state persistence.