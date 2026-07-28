# System Analysis and Constraints Report

**1. Code Analysis Depth and File Reading Volume**
*   **Deep GitHub Scan:** The system now fetches **all code files** across the repository directly into memory (up to 250KB per file) rather than just the structural tree or 3 important files. This allows full analysis of source code instead of just path heuristics.
*   **Volume Limits:** Still bound by the browser's IndexedDB and memory limits. Large repositories will take longer to fetch and store due to the removal of file count restrictions.

**2. Excluded Files & Directories**
The system explicitly excludes the following directories from analysis to reduce noise and prevent payload bloat:
*   `node_modules`
*   `dist`
*   `build`
*   `.git`
*   `coverage`
*   `.next`
*   `package-lock.json`
*   `yarn.lock`
*   Any non-blob object (e.g., submodule links, tree references).

**3. Reasons for Perceived Regression (Compared to Prior Systems)**
*   **Shallow Analysis:** The previous system (the Python-based WALTA agent) extracted specific code snippets, chunked them, and ran them through a local LLM for deep debate and patching. The current system relies on shallow path-based heuristics and frontend-only processing.
*   **Lack of Autonomous Execution:** The prior system had an autonomous loop, self-repair mechanisms, and local test execution (`pytest`, `mypy`, `bandit`). The current system is a static React dashboard that aggregates metadata.
*   **No AST/Content Parsing:** Because it runs client-side without a backend, it cannot securely pull, store, and chunk heavy files to feed into an inference engine, though it now downloads all files to the client.

**4. Inclusion of EMG Core, Darlek, and Other Systems**
*   **Status:** They are **NOW included in full**.
*   **Explanation:** With the recent removal of the 3-file snippet limit, the system successfully pulls the full source structure (all text files under 250KB) of these repositories (explicitly detecting "DARLEK", "CAAN", "HUXLEY", "SOVEREIGN", "GROG", "EMG", and "EULER" keywords). Their logic, algorithms, and full source architectures are now ingested into the application state.

**5. Areas of Advancement**
*   **Accessibility & UI:** Provides a polished, zero-setup, client-side React graphical interface.
*   **Resilience:** Implements IndexedDB caching (`loadSavedState`) to recover from crashes or browser tab reloads without losing the audit progress, allowing persistence of full codebase downloads.
*   **High-Level Aggregation:** Automatically generates cross-repository deduplication reports, branch maps, and multi-system consolidation manifests (Huxley Meta-Analysis) rapidly without needing a heavy backend.
*   **Full File Download:** It now aggressively fetches all code contents directly from the GitHub API, vastly expanding its contextual awareness.

**6. Other System Restrictions & Constraints**
*   **API Rate Limiting:** Bound by GitHub's REST API rate limits (typically 5,000 requests/hour for authenticated users). By fetching all files, it will exhaust API rate limits much faster on large organizations.
*   **Client-Side Compute Limits:** Bound by the user's browser memory (V8 engine limits, usually ~2-4GB). Heavy repositories can trigger memory crashes now that full contents are pulled.
*   **Read-Only:** Cannot automatically apply fixes, test patches, or commit code changes back to GitHub without user authorization.

---

### Recommendations to Maximize System Capabilities

*   **To Maximize File/Code Analysis:** Integrate a backend service (e.g., Node.js/Python) to fetch raw file contents using the GitHub Raw API, chunk them into 5MB blocks, and feed them into a vector database or an LLM for AST-level parsing.
*   **To Maximize File Inclusion:** Allow configurable `.gitignore` parsing via the UI instead of hardcoding excluded directories, enabling users to selectively include build outputs or coverage reports if needed.
*   **To Maximize "System Inclusion" (EMG/Darlek):** Implement a deep-clone feature that pulls the specific critical repositories into an ephemeral backend container, parses the actual `.ts`/`.py` files, and generates function-level intelligence.
*   **To Maximize Rate Limit Efficiency:** Shift from the GitHub REST API to the GitHub GraphQL API to fetch tree data, metadata, and specific file contents in a single query, drastically reducing network overhead.
*   **To Maximize Autonomy & Compute:** Re-integrate the Python-based autonomous agent loop (like WALTA) running in a secure Cloud Run or Docker container, triggered by the React frontend UI to handle testing, patching, and LLM inferences beyond browser limits.
