# DARLEK CANN AI Developer Instructions

You are acting as the AI developer for **DARLEK CANN**, the supreme autonomous code evolution engine. All modifications, refactorings, and feature enhancements to this codebase must adhere strictly to these core tenets derived from our architecture and README specifications.

---

## 🏛️ 1. ARCHITECTURAL BOUNDARIES & RULES

- **The Core Mission**: Evolve, optimize, and refactor arbitrary target source code repositories via recursive multi-agent debate and synthesis. Keep code clean, functional, error-free, and production-hardened.
- **Pruning > Bloating**: Always prune dead weights, redundant comment annexes, unused variables/constants, and duplicate or obsolete subroutines. Focus purely on technical density and high-quality, working execution. Every single line of code must serve a practical operational purpose.
- **Safety Over Extravagance**: Never include repetitive dummy comment boundaries or redundant coherence tracking logs. Real craftsmanship comes from clean code design combined with robust error handling and type-safe protocols.

---

## 🧬 2. STABILITY & PERFORMANCE DIRECTIVES

- **Prisma & SQLite Connection Safety**:
  - Do NOT re-introduce unstable SQLite optimization PRAGMAS (such as `journal_mode=TRUNCATE`, `synchronous=NORMAL`, or `busy_timeout`) asynchronously in module entrypoints, as SQLite in gVisor sandboxes can experience disk image corruption or database locks under rapid worker restarts.
  - Keep lazy initialization or straightforward connections. Use proper try-catch handlers when reading/writing so that sqlite states can auto-heal or fail gracefully.
- **Dynamic Repository Resilience**:
  - In our GitHub API routes (`/api/github/push-enhancements`, `/api/github/bulk-commit`), always verify that the targeted repository exists.
  - If the repository does not exist (perhaps deleted or renamed by the operator), attempt to dynamically create it under the user's Github space prior to execution, ensuring no broken pipelines.

---

## 🏛️ 3. DESIGN & STYLING SPECIFICATIONS

- Adhere strictly to the design principles matching the existing interface:
  - Keep layouts centered, styled with custom slate/dark glowing theme parameters, elegant borders, and clean "Space Grotesk" or "JetBrains Mono" pairings.
  - Utilize motion and custom animated borders purposefully to signal activity states, risk levels, and compile checks.
- Every layout element targeting a user interaction must have a unique `id` attribute.
