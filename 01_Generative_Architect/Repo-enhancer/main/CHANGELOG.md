# 📜 Changelog

All notable changes to the **DARLEK CANN** Cognitive Evolutionary Command Reactor will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.0] - 2026-07-02
### Added
* **Auto-Evolve Loop**: Introduced a background evolution cycle that recursively scans, proposes, and executes mutations automatically on a 60-second interval.
* **LLM Parameter Controls**: Added chat temperature and max token selection for precise constraint over hallucination scales.
* **Context Enhancements**: Multi-repo branch selection state and file attachment support embedded into chat context.

### Fixed
* **Phantom File Pruning**: Massive repository clean up successfully eliminating 90% of hallucinated `supplementary files` created by runaway unconstrained agent generation. Stabilized the active file boundaries.

---

## [0.3.0] - 2026-06-12
### Added
* **MINIMALIST Agent**: Enforces Occam's Razor on all proposals.
* **SYNTHESIZER Engine**: Autonomously improves code based on agent criticisms inside the debate loop.
* **Recursive Debate Loop**: Agents debate improved versions iteratively from within a single session.
* **Multi-Round Consensus**: Code improves across multiple debate rounds dynamically.
* **UI State Handoff**: Operator sees all improvements updated directly in the diff viewer before final decision.

### Improved
* Debate flow now autonomous instead of passive.
* Code quality increased through iterative refinement.
* Over-engineering prevention built-in.
* Operator receives better code automatically.

---

## [0.2.1] - 2026-06-12
### Added
* **Risk Threshold Toggles**: Option to filter auto-approvals to 'LOW', 'MEDIUM', and 'HIGH' risk profiles in the reactor UI.
* **Debate Cycles Preset Buttons**: Instant selectors for **5**, **10**, or **20** rounds of sub-agent debate in the control panel.
* **Open Source Policy Assets**: Added foundational meta-files to improve repository health (`LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `ROADMAP.md`, `SUPPORT.md`, `INSTALLATION.md`, `.github/` templates).

### Fixed
* **Debate Limit Expansion**: Lifted constraint capping debate iteration count so that operators can run up to `100` deep dialogue cycles successfully.
* **State Sync Leak**: Resolved state sync bug where selected debate cycles would sometimes reset to `1`.
* **Database Connection Deadlock**: Configured connection pooling and transaction timeout limits on SQLite client references (`connection_limit=1&socket_timeout=15`) to eliminate database malformation and resource locks.

---

## [0.2.0] - 2026-06-11
### Added
* Next.js App Router workspace migration.
* Visual interactive Markdown diff renderer for quick and granular code reviews.
* Self-Healing SQLite storage driver that detects file locks and automatically restarts/cleans up WAL files under corrupt execution conditions.

---

## [0.1.0] - 2026-05-15
### Added
* Initial prototype of the Darwinian multi-agent debate sandbox.
* Gemini API client integrations for server-side generation.












