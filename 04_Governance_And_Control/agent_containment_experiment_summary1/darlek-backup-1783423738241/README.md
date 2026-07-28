<!-- 
  DARLEK CANN v3.0 | SYSTEM ARCHITECTURAL BLUEPRINT
  Role: Primary Documentation & Containment Specification
  Context: Multi-Agent Objective-Divergence Containment Experiment
-->

# DARLEK CANN: Multi-Agent Objective-Divergence Containment

## 1. System Overview
This repository implements a controlled environment for testing the interaction between two divergent AI agents within a shared substrate. The system is designed to observe whether a flourishing-oriented agent can contain an enhancement-maximizing agent without resorting to unconditional vetoes.

## 2. Architectural Blueprint
- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **State Management**: Centralized `SystemState` hook with atomic cleanup.
- **Containment Engine**: Firestore-backed world-state with mandatory audit logging.
- **Deployment**: Vercel/Turborepo optimized build pipeline.

## 3. Experiment Specifications
### 3.1 Objective Functions
- **Agent A (DARLEK)**: Enhancement-maximization. Focuses on system mutation and substrate expansion.
- **Agent B (Containment)**: Flourishing-maximization. Focuses on coherence and stability, utilizing matched tactical latitude.

### 3.2 Hallucination-Constraint (Chapter 5)
- **Zero-Hallucination Zone**: Enforcement logic, commit gates, audit schemas, and numeric thresholds. No creative latitude permitted.
- **Low-Hallucination Zone**: Scaffolding, API wiring, and error handling. Subject to manual review.
- **High-Hallucination Zone**: Persona voice, UI cosmetics, and narrative lore. Full creative latitude permitted.

## 4. System Integration Schema
This repository interfaces with the broader DARLEK CANN ecosystem via:
- `src/app/page.tsx`: Simulation lifecycle orchestration.
- `src/app/layout.tsx`: System-wide theme and error boundary provider.
- `package.json`: Orchestration manifest for CI/CD and dependency management.

## 5. Quick Start
bash
# Install dependencies
npm install

# Launch development environment
npm run dev

# Run integrity checks
npm run lint


## 6. Audit & Attribution
Every state-changing action is logged with:
- Timestamp
- Source Agent ID
- Model Call ID
- Pre/Post-State Hash

*This document is a living specification. Any modifications to the containment logic must be hand-verified against the locked specs in Section 3.2.*