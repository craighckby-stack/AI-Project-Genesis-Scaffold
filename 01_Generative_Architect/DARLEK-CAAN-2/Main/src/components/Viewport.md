# Viewport Architectural Blueprint

## Overview
The `Viewport` component serves as the primary rendering interface for the DARLEK CANN simulation engine. It utilizes a high-frequency `requestAnimationFrame` loop to project 3D world-space coordinates into 2D screen-space.

## Architecture
- **Projection Engine**: Uses a custom matrix projection function `projectCoord` supporting orthographic and isometric-like 3D transformations.
- **State Management**: Decoupled from the main simulation loop to ensure UI responsiveness.
- **Performance**: Utilizes `devicePixelRatio` scaling and `alpha: false` canvas context for GPU-accelerated rendering.

## Integration
- **Engine**: Consumes `Agent[]` and `ResourceNode[]` from the central `WorldState`.
- **Lifecycle**: Managed via `useEffect` cleanup handlers to prevent memory leaks during hot-reloads or component unmounting.

## Future Extensions
- Implementation of a WebGL-based shader pipeline for large-scale agent swarms.
- Integration with `unitary-core` for quantum-state visualization.






