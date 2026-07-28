# DARLEK CANN — Core Architectural Features

DARLEK CANN is not a passive code suggestion tool; it is an active, multi-agent sandbox that generates and self-guards code mutations. This document describes the three cornerstone architectural pillars that power the system.

---

## 🏛️ 1. Game-Theoretic Debate Engine

Unlike single-turn LLMs that directly output suggestions, DARLEK CANN relies on specialized adversarial agent panels to deliberate code quality.

### How It Works
* **Adversarial Agents**: We initiate multiple conflicting agent personas (e.g., **SECURITY SPECIALIST** - identifying XSS/vulnerability risks; **OPTIMIZER** - analyzing runtime performance; **REALIST** - focusing on maintainability).
* **Multi-Cycle Rounds**: The debate runs for a customizable amount of rounds (configurable via the UI to presets of **5**, **10**, or **20** cycles, or custom variables).
* **Consensus Synthesis**: In each round, every agent reads the proposal, evaluates the replies of they peers, challenges assumptions, and changes their vote based on sound argumentation. The reactor completes once a full consensus is reached or cycles execute fully.

---

## 🛡️ 2. Dynamic Risk-Scoring Engine

Every mutation is statically analyzed and scored block-by-block on a scale from `1` to `10`.

### Scoring Rules
* **Baseline**: Every proposal starts with a baseline risk score of `2`.
* **Structural Length**: If code lengths surpass `300 lines`, `+1` risk is assigned.
* **Error Vulnerability**: If code lacks standard error handling blocks (e.g., `try/catch` or guards) and contains multiple exports, `+1` risk is assigned.
* **Import Density**: Highly coupled files with `> 15` packages trigger a `+1` risk penalty.
* **Complexity Index**: Cyclomatic complexity estimates higher than `6` trigger further penalties.

### Risk Thresholds
The scores map directly to clean qualitative states:
* 🟢 **LOW RISK** (`<= 3` score): Simple localized logic updates; can be automated easily.
* 🟡 **MEDIUM RISK** (`<= 6` score): Major single-file structural updates or database queries.
* 🔴 **HIGH RISK** (`<= 8` score / `CRITICAL` `> 8`): Core router configuration edits, dependency modifications, or major code drops.

---

## 👁️ 3. Coherence Gate Mechanics

The **Coherence Gate** represents the final sanity check layer. It sits between code generation and physical file commit in the Git repository.

```
[Mutation Proposal] ──> [Adv. Debate (e.g., 5-20 Cycles)] ──> [Risk Analyzer]
                                                                     │
 [Commit to Repo] <── [Coherence Gate: Compiler Verification] <──────┘
```

1. **Dry-Run Analysis**: Applies the proposed diff onto a virtual memory stage representing the target repository structure.
2. **Compiler & Linter Verification**: Proactively runs `npx eslint` and validation compilation commands to verify type-safety.
3. **Automated Rollback**: If compile issues or catastrophic lint regressions occur, the Coherence Gate slams shut—denying the mutation and reverting the file tree back to its clean state automatically.

---

## 📊 Feature Comparison Matrix

| FEATURE DIMENSION | STANDARD AI ASSISTANTS <br> *(e.g. Copilot, Cursor)* | CORE AGENT FRAMEWORKS <br> *(e.g. AutoGen, CrewAI)* | DARLEK CANN <br> *(Our Active System)* |
| :--- | :--- | :--- | :--- |
| **Execution Command** | Single developer acts as the compiler and sole decision maker. | Agents complete tasks in hypothetical text loops; execution sandbox is isolated from real repos. | **Self-Directed Git Pipeline**: Runs mutations directly on Git, scans for tests, and submits actual commits back to the remote tree. |
| **Consensus Mechanism** | None. Single generative model prints text. | Highly programmatic, rigid step-by-step state charts. | **Game-Theoretic Debate**: Multi-agent adversarial design with customizable cycles to reach consensus. |
| **Risk Safeguarding** | Dependent on the developer squinting at their screen to catch bugs. | Often ignores downstream context or crashes in endless loops. | **Active Saturation & Risk Scores**: Assigns measurable risk thresholds and allows automated or human-in-the-loop overrides. |

**Contrast with Passive Enterprise Bots**: Enterprise PR review bots (e.g., CodeRabbit, Mend) focus purely on passive analysis of PRs that humans already wrote. They do not proactively draft the evolutionary steps themselves. DARLEK CANN closes that loop by being both the generator (Mutation Engine) and the gatekeeper (Multi-Agent Debate Chamber).
