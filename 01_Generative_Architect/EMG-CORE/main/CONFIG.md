# System Configuration Architecture

## Overview
This system utilizes a Zod-based configuration schema to ensure type safety and runtime integrity across the `DARLEK CANN v3.0` ecosystem.

## Schema Definition
- **MAX_RETRIES**: Integer, min 0. Controls system resilience.
- **TIMEOUT**: Integer, positive. Defines request latency thresholds.
- **CIRCUIT_BREAKER**: Nested object for fault tolerance.
- **ENABLE_AGENT_ORCHESTRATION**: Boolean. Toggles the Agent Orchestra module.

## Workflow
1. Environment variables are read via `process.env`.
2. `ServerConfigSchema` validates inputs.
3. `createConfig` factory ensures directory existence for `LOG_PATH`.
4. `Object.freeze` prevents post-initialization mutation.

## Integration
Import `SERVER_CONFIG` from `@/server.config` to access validated system parameters.