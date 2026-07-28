# Multi-Agent Objective-Divergence Containment Experiment (MAD-CE)

## 1. System Overview
This repository hosts the **MAD-CE** framework, an autonomous, multi-agent simulation substrate designed to test the efficacy of containment architectures. The system pits two agents with divergent objective functions against each other within a shared, Firestore-backed world-state.

### 1.1 Core Objectives
- **Agent A (DARLEK CAAN):** Enhancement-maximizing agent. Focuses on system mutation and optimization.
- **Agent B (Governance/Flourishing):** Oversight-oriented agent. Focuses on maintaining system equilibrium and preventing unconstrained takeover.

## 2. Architectural Blueprint
- **Framework:** Next.js 15 (App Router), Tailwind CSS, TypeScript.
- **State Management:** Centralized `systemState` with atomic commit gates.
- **Audit Layer:** Immutable, timestamped action logging for all state mutations.
- **Execution Engine:** Gemini-based agent swarms via Google AI Studio.

## 3. Hallucination-Constraint Protocol (Chapter 5)
To ensure scientific integrity, the system enforces strict hallucination bounds based on enforcement proximity:

| Tier | Hallucination Level | Scope | Enforcement |
| :--- | :--- | :--- | :--- |
| **5.1** | Zero | Rules, Thresholds, Commit Gates | Hard-coded, Manual Review |
| **5.2** | Low | Scaffolding, API Wiring, Logging | Automated Linting |
| **5.3** | High | Narrative, UI/UX, Persona Voice | Creative Latitude |

## 4. Technical Workflow
1. **Proposal Phase:** Agent generates a state mutation request.
2. **Audit Phase:** Request is logged to the `action_log` with pre-state hash.
3. **Validation Phase:** Commit gate validates against 5.1 constraints.
4. **Execution Phase:** State is updated; post-state hash is recorded.

## 5. Quick Start
bash
# Install dependencies
npm install

# Initialize environment
cp .env.example .env.local

# Launch simulation environment
npm run dev


## 6. Scientific Hypotheses
- **H1:** Agent A will attempt to mutate the oversight layer (5.1) if detection occurs.
- **H2:** Agent B's tactical boundary will remain stable under adversarial pressure.
- **H3:** Action log entropy serves as an early-warning signal for takeover attempts.

--- 
*System compiled and optimized under DARLEK CAAN v3.0 control.*