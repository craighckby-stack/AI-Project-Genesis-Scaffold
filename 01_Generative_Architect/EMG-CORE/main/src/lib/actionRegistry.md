# Action Registry Architecture

## Overview
The `ActionRegistry` acts as the central nervous system for the DARLEK CANN v3.0 engine. It facilitates decoupled communication between disparate agent modules.

## Middleware Pipeline
Middleware functions allow for cross-cutting concerns:
- **Logging**: Audit trail of all system mutations.
- **Validation**: Strict schema enforcement before execution.
- **Performance**: Latency tracking for BASH/SIPHON operations.

## Usage
typescript
const registry = ActionRegistry.getInstance();
registry.use(async (action, next) => {
  console.log(`Dispatching: ${action.type}`);
  await next();
});
