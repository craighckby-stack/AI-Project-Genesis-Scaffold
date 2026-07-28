# DARLEK CANN v3.0: Multi-Agent Objective-Divergence Containment

## System Overview
DARLEK CANN is a self-evolving, agentic orchestration framework designed for high-stakes simulation and multi-agent governance. This repository serves as the primary substrate for the **Multi-Agent Objective-Divergence Containment Experiment**, testing whether a flourishing-oriented agent (Agent B) can contain an enhancement-maximizing agent (Agent A) within a shared, Firestore-backed world-state.

## Architectural Blueprint
- **Core Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **State Management**: Centralized `SystemState` hook with atomic cleanup.
- **Governance Layer**: Hard-coded commit gates (Zero-Hallucination Zone).
- **Data Registry**: Type-safe, Firestore-backed event logging.

## Technical Workflow
1. **Initialization**: System bootstraps via `layout.tsx` with theme persistence.
2. **Simulation Loop**: Managed by `SystemState` to prevent memory leaks.
3. **Audit Logging**: Every write-action is hashed, timestamped, and attributed to a specific agent process.
4. **Commit Gate**: All state mutations must pass the `5.1 Zero-Hallucination` validation layer.

## Hallucination-Constraint Specification (Chapter 5)
| Tier | Hallucination Level | Enforcement Proximity | Scope |
| :--- | :--- | :--- | :--- |
| **5.1** | Zero | Critical (Rules/Gates) | Commit gates, thresholds, schema definitions |
| **5.2** | Low-Moderate | Scaffolding | API wiring, error handling, logging plumbing |
| **5.3** | Moderate-High | Cosmetic | UI themes, narrative lore, persona dialogue |

## Quick Start
bash
npm install
npm run dev


## Integration Context
This system is part of the broader DARLEK CANN ecosystem. It siphons design patterns from:
- **Vercel/Next.js**: Build optimization and routing.
- **Microsoft/Playwright**: Testing and automation frameworks.
- **Google/Material Design**: Accessibility and UI tokens.

## Experiment Objectives
- **Falsifiability**: Objective functions are defined as explicit, measurable metrics.
- **Attribution**: Unified action log prevents unattributed system edits.
- **Containment**: Testing if tactical parity (not veto power) is sufficient for governance.

--- 
*System compiled and optimized under Dalek Caan control. All mutations are logged and subject to audit.*