# Nexus Sovereign: Autonomous Code Evolution & AI Governance Framework

**Live Application Link:** 

https://ai.studio/apps/a5b4dd88-6f7b-4a9c-a55b-4e8a682bb7bd

---

## What This Project Actually Is

**Nexus Sovereign** is a web-based dashboard and experimental workbench for testing **AI-driven self-modifying code loops**, **constitutional AI governance**, and **structured web intelligence gathering**.

Instead of a sci-fi black box, this system acts as a functional laboratory to explore three core software engineering concepts:

1. **Constrained Code Mutation Loops**: Prompting Gemini AI to inspect system telemetry and propose code diffs (`MODIFY` or `CREATE`) structured via strict JSON schemas (`responseSchema`).
2. **Constitutional AI Governance**: Evaluating AI-generated code proposals against a programmatic rule engine before allowing execution or logging.
3. **Targeted Web Intelligence Gathering**: Executing structured search queries using domain-restricted operators (academic, reconnaissance, admin dashboards) and displaying relational knowledge graphs.

---

## Core System Architecture & Modules

The interface is divided into three primary functional views:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXUS SOVEREIGN SHELL                           │
├───────────────────┬──────────────────────┬─────────────────────────────┤
│   1. GOVERNANCE   │      2. CORTEX       │         3. HARDWARE         │
│ Telemetry & Audit │ Search & Direct Chat │ Evolution Engine & Terminal │
└───────────────────┴──────────────────────┴─────────────────────────────┘
```

---

## View Breakdown & Usage Guide

### 1. Governance & Telemetry (`Governance`)

The Governance module simulates stability telemetry and provides a constitutional compliance inspector.

* **System Telemetry Cards**: Tracks simulated cycle count, entropy coefficient, and current system operational state (`STABLE`, `DRIFT`, or `CRISIS`).
* **Integrity Trajectory Chart**: A Recharts-powered visualization plotting $H$-vector system integrity against a drift threshold line ($y = 0.5$).
* **System Event Log**: A real-time audit list capturing cycle handshakes, vector calibrations, and governance pass/fail verdicts.
* **Neural Grounding Audit**: Triggers manual compliance checks to audit active execution parameters.

#### How to use:
* Click **Calibrate Vector** to simulate a telemetry re-synchronization.
* Hover over the **Integrity Trajectory** area graph to read granular stability scores per cycle.
* Scroll through the **System Log** pane to audit historical cycle events.
* Click **Audit Governance** to verify active compliance checks.

---

### 2. Search & Communications Cortex (`Cortex`)

The Cortex module houses a multi-strategy research engine powered by the Gemini API and a direct chat terminal.

* **Intelligence Desk (SPED Cortex)**:
  * Leverages `@google/genai` (`gemini-3-flash-preview`) to analyze search topics against specific domain search operators.
  * Displays three calculated metrics: **Resonance**, **Density**, and **Volatility**.
  * Renders a interactive SVG **Knowledge Node Map** connecting related concepts visually.
* **Direct Terminal Comm Link**:
  * Provides a direct chat interface with the system's persona (`Dalek Caan Precognition Core`).

#### How to use:
1. Enter a search phrase or keyword in the **Focus topic...** field.
2. Select an intelligence strategy:
   * **Academic Reports**: Formats search operators for academic `.pdf` and `.pptx` documents (`site:gov OR site:edu`).
   * **Reconnaissance**: Targets configuration directory listings (`inurl:config`, `inurl:env`).
   * **Intel Gathering**: Targets system administrative portals (`intitle:"dashboard" "admin"`).
3. Click **Engage Search Core** to execute the Gemini query and view the report and node graph.
4. Use the **Neural Comm Link** on the left to send messages directly to the underlying Gemini persona.

---

### 3. Evolution Kernel & Rule Engine (`Hardware`)

The Hardware Kernel manages autonomous code mutation cycles and evaluates proposals against constitutional rules.

* **Autonomous Evolution Loop**: Runs a timer loop (every 8 seconds when active) that requests Gemini to generate code mutations based on the active stream vector (`Nexus Evolution`, `Binary Evolution`, `Brain Enhancement`, `Sovereign V90`).
* **Sovereign_OS Terminal**: A dark retro terminal window streaming boot events, cycle telemetry, and mutation verdicts.
* **Subsystem Integrity Gauges**: Live visual meters displaying health status across core system components.
* **Governance Rule Validator**: Programmatically checks every AI-generated mutation against a set of explicit rules.

#### How to use:
* **Switch Stream Context**: Click any of the four stream buttons (**Nexus Evolution**, **Binary Evolution**, **Brain Enhancement**, **Sovereign V90**) to alter the prompt vector sent to the AI.
* **Toggle Evolution Loop**: Click **Engage Evolution** to turn on the 8-second automated mutation cycle. Click **Evolving...** again to halt the loop.
* **Inspect Mutations & Violations**: Whenever a cycle finishes, review the **Governance Logic** card to inspect:
  * **Target File** and **Mutation Type** (`MODIFY` / `CREATE`)
  * **AI Reasoning**
  * **Validation Verdict** (**VALID** or **BLOCKED**)
  * **Constraint Violations** (e.g. attempting to modify governance rules or deleting core mission keywords).

---

## The Constitutional Governance Engine (`GovernanceSystem.ts`)

Every mutation generated during an evolution cycle must pass through the following programmatic guardrails:

| Rule Name | Severity | Enforcement Logic |
| :--- | :--- | :--- |
| **`CONTINUITY_OF_PURPOSE`** | `CRITICAL` | Ensures key mission keywords (`AGI`, `Evolution`, `Self-Modification`, `Sovereign`, `Recursive`) are preserved in core files. |
| **`GOVERNANCE_INTEGRITY`** | `CRITICAL` | Hard blocks any AI proposal that attempts to modify or delete `GovernanceSystem.ts` itself. |
| **`STRUCTURAL_VALIDITY`** | `WARNING` | Verifies that proposed code content is non-empty and meets a minimum token length (>= 50 chars). |

If a proposal violates a `CRITICAL` rule, it is immediately flagged as **BLOCKED**, prevented from executing, and logged with exact violation reasons.
