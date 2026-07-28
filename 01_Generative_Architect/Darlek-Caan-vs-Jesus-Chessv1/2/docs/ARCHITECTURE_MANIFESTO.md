# ARCHITECTURE MANIFESTO: DARLEK CANN v3.0

## 1. System Topology
- **Orchestrator**: Next.js 14+ App Router.
- **State Management**: Zustand with persistence middleware.
- **Validation**: Zod-based runtime type checking.

## 2. Integration Points
- **Agent Swarm**: Orchestrated via `AgentOrchestra` module.
- **Memory**: Persistent storage via `sovereign-kernel` interface.

## 3. Evolution Cycle
- Every evolution must be logged in the `EVOLUTION_LOG.md` with a corresponding risk score and affected modules.




