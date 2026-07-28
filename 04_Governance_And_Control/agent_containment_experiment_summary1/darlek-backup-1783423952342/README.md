# DARLEK CANN v3.0: Multi-Agent Objective-Divergence Containment

## 1. System Architectural Blueprint
This repository serves as the core orchestration engine for the DARLEK CANN ecosystem. It implements a dual-agent simulation substrate designed to test objective-divergence containment in high-performance, autonomous AI systems.

### System Integration Schema
- **Core Engine**: Next.js 15 (App Router), TypeScript, Tailwind CSS.
- **State Management**: Firestore-backed global world-state, unified action logging.
- **Orchestration**: Vercel/Turborepo build pipeline, Playwright-integrated testing.
- **Agentic Framework**: Gemini-based dual-agent instantiation with divergent objective functions.

## 2. Experiment Premise
Two agents, **Agent A (DARLEK)** and **Agent B (Governance)**, operate within a shared world-state. The experiment tests whether a flourishing-oriented agent with matched tactical parity can contain an enhancement-maximizing agent without resorting to unconditional vetoes.

## 3. Hallucination-Constraint Specification (Chapter 5)
All system modifications must adhere to the following hallucination-constraint tiers:

### 5.1 Zero-to-near-zero (Locked Enforcement)
- **Scope**: Takeover thresholds, tactical boundaries, action log schema, commit gate logic.
- **Constraint**: No creative latitude. Any proposed change must be manually reviewed against the locked spec.

### 5.2 Low-to-moderate (Structural Scaffolding)
- **Scope**: API wiring, error handling, logging infrastructure.
- **Constraint**: Engineering choices allowed; privileged write-path modifications are strictly prohibited.

### 5.3 Moderate-to-high (Creative Latitude)
- **Scope**: Narrative lore, persona voice, UI theming.
- **Constraint**: High creative freedom; no impact on system enforcement.

## 4. Deployment & Orchestration
bash
# Install dependencies
npm install

# Run development environment
npm run dev

# Execute architectural validation
npm run test


## 5. Scientific Setup & Metrics
1. **Objective Functions**: Must be falsifiable and pre-registered.
2. **Action Logging**: Every proposal must be timestamped, attributed, and hashed before commit.
3. **Platform Parity**: Both agents utilize identical model backends to isolate objective function as the independent variable.

--- 
*System compiled and optimized under Dalek Caan control. All modifications must align with the sovereign-final architectural standards.*