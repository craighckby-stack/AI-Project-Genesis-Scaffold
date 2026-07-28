note- process 16 files on free tire then throws network error wich is short for api exsausted and then skips other files.  built for self education and enhancing files and producing working code.

finished & working.

https://ai.studio/apps/a813bef8-264d-4781-923c-42e29492f33a

https://github.com/craighckby-stack/Simulation-

12 minutes to change my half completed reposatory to finished completion with saturation limit achieved and working correctly.

# GitHub Repository Refactoring & Evolution Pipeline (DARLEK CANN)

A full-stack Next.js application designed to automate codebase quality analysis, generate AI-powered refactoring proposals, and manage codebase enhancements with direct GitHub integration and human-in-the-loop controls.

---

## DARLEK CANN Overview & Feature Comparison

Unlike standard visual assistants, DARLEK CANN represents an **active, self-directed closed-loop system** rather than a passive text completion field:

* **What DARLEK CANN does differently**: Instead of waiting for you to type `// write a function`, it actively scans your designated file paths, identifies architectural & technical debt, drafts targeted code diffs, evaluates security or compatibility vulnerabilities via game-theoretic adversarial debates, and awaits operator staging to commit to your live branch.
* **Contrast with Enterprise PR Bots**: Enterprise setups (like automated PR review bots such as CodeRabbit or Mend) focus purely on passive analysis of PRs that humans already wrote. They do not proactively draft the evolutionary steps themselves. DARLEK CANN closes that loop by being both the generator (Mutation Engine) and the gatekeeper (Multi-Agent Debate Chamber).

### Architectural Comparison Matrix

| Feature Dimension | Standard AI Coding Assistants (e.g., Copilot, Cursor) | Core Agent Frameworks (e.g., AutoGen, CrewAI) | DARLEK CANN (Our Live Framework) |
| :--- | :--- | :--- | :--- |
| **Execution Command** | Single developer acts as the compiler and sole decision maker. | Agents complete tasks in hypothetical text loops; execution sandbox is isolated from real repositories. | **Self-Directed Git Pipeline**: Runs mutations directly on Git, scans for tests, and submits actual commits back to the remote tree. |
| **Consensus Mechanism** | None. Single generative model prints markdown text in a sidebar. | Highly programmatic, rigid step-by-step state charts. | **Game-Theoretic Debate**: Multi-agent adversarial design (e.g., Security Specialist vs. Rapid Evolver) with configurable cycles to reach a consensus. |
| **Risk Safeguarding** | Dependent on the developer squinting at their screen to catch bugs. | Often ignores downstream context or crashes in endless state loops. | **Active Saturation & Risk Scores**: Assigns measurable risk thresholds and allows automated or human-in-the-loop overrides. |

---

## What It Does

The application connects directly to any target GitHub repository to run a cyclic code refactoring pipeline:

1. **Repository Scanning**: Downloads the file hierarchy from a targeted GitHub repository and branch using a GitHub Personal Access Token (PAT).
2. **Analysis & Code Mutation**: Leverages the Gemini API (with a robust model fallback and backoff retry mechanism) to generate structured refactoring proposals for any selected source code file.
3. **Simulated Deliberation**: Convenes a multi-perspective review panel (simulating performance, compatibility, and safety reviews) to rate and vote on proposals.
4. **Coherence & Risk Assessment**: Scores proposed edits across metrics like structural change, velocity, and semantic impact to block overly high-risk changes.
5. **Interactive Diff Visualizer**: Render a side-by-side comparison of the proposed modifications against the existing file content.
6. **Chat-Based & Button Controls**: Allows operator approval, rejection, or feedback either through direct buttons or an interactive chat console.
7. **Direct Commits (Push)**: Sequentially pushes finalized changes back to the designated branch in target repositories on GitHub.
8. **Batch Operations Mode**: Offers automated sequential scanning, mutation framing, and automatic code commit operations across multiple files.

---

## Technical Stack & Configuration

* **Framework**: Next.js (App Router)
* **Frontend**: React, Tailwind CSS, Lucide icons, and Framer Motion
* **Database**: SQLite managed via Prisma ORM (used for keeping log history, batch states, and rejection history)
* **API Integrations**: GitHub REST API (direct operations) and Generative Language API (Gemini models)

---

## Directory Architecture

```
├── prisma/
│   ├── dev.db                            # Local SQLite storage database
│   └── schema.prisma                     # Local log schema models
│
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Primary user interface and orchestrator engine
│   │   └── api/                          # Next.js API routes for backend logic
│   │       ├── brain/                    # Back-end database state sessions
│   │       ├── evolution/                # Propose, analyze, debate, & auto-test actions
│   │       ├── github/                   # Scan, read-file, write-file, and push mutations
│   │       └── setup/                    # Connector validation API
│   │
│   ├── components/                       # UI components (Diff viewer, chat panels, etc.)
│   ├── lib/
│   │   ├── db.ts                         # Self-healing Prisma database wrapper
│   │   ├── gemini.ts                     # Robust model-fallback Gemini fetch wrapper
│   │   └── types.ts                      # Shared TypeScript definitions
```

---

## Getting Started

### 1. Environment Verification
Ensure your environment has Node.js (18+) installed.

### 2. Configure Local Environment
Copy `.env.example` to `.env` and fill out any necessary variables if you want them preloaded.

### 3. Install Dependencies & Build Database
```bash
npm install
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Operator Guide

1. **Authorized Access**: Enter raw Git details (Organization/Profile, Repository, target Branch) and a GitHub Personal Access Token.
2. **File Targeted Scans**: Select any file from the scanned list to target it.
3. **Trigger Refactor Proposals**: Click the propose command or converse with the integrated chat console to guide changes.
4. **Code Execution**: Assess the differential changes via the diff viewer. Approve to commit instantly or Reject to discard.
