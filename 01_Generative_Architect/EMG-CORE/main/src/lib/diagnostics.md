# Diagnostics Engine Architecture

## Overview
The `DiagnosticsEngine` serves as the central telemetry hub for the Agent Orchestra. It implements a circular buffer pattern to maintain a fixed-size memory footprint while providing real-time event streaming.

## Integration Schema
- **Input**: `TelemetryPayload` (Agent ID, Timestamp, Metrics)
- **Output**: Event-driven stream via `subscribe()`
- **Persistence**: In-memory circular buffer (Max 256 entries)

## Workflow
1. **Ingestion**: Agents push metrics via `diagnostics.recordMetrics()`.
2. **Processing**: Engine validates payload and updates internal state.
3. **Distribution**: Subscribers receive real-time updates via EventEmitter.
4. **Cleanup**: Use the returned unsubscribe function to prevent memory leaks in React components.

## Usage
typescript
const unsubscribe = diagnostics.subscribe((data) => {
  console.log('Agent Load:', data.metrics.cognitiveLoad);
});
// On component unmount:
unsubscribe();
