# EMG Core

EMG Core is an interactive, evolving "Grounded Intelligence System" built with React, Node.js, and multi-provider AI orchestration. Instead of functioning as a stateless chatbot, EMG Core operates as a continuous cognitive entity that learns, reflects, and mutates its own behaviors based on user interactions.

## What It Does

- **Continuous Evolution:** EMG Core maintains a persistent `CoreIdentity` that grows over time. It tracks its principles, learning logs, and mutation history.
- **Autonomous Parameter Tuning:** The system self-regulates operational metrics like `rigidity` (strictness of principles), `autonomy` (ability to inject novelty or auto-cycle), and `contextual debt` (the cost of retaining knowledge vs. its utility).
- **Teleological Constraints:** The agent identifies and strict rules/boundaries ("Teleological Constraints") to abide by in future output generation.
- **Architectural Siphoning (Genetic Siphon):** When linked with a GitHub token, the AI can read and extract structural patterns or "manifests" from external repositories and integrate them into its internal Mutation Registry.
- **Deep Research & Self Reflection:** Operations trigger multi-stage internal pipelines that include external web research, bicameral debate, and self-reflection loops.

## How It Works

The architecture relies on a full-stack React + Express design.

1. **The Heptadic Sequence:** Every interaction goes through an internal analysis pipeline:
   - *Phase 0 (Question/Constraints):* Evaluates user input and extracts any necessary boundary constraints.
   - *Phase 1 (Research):* Runs a deep research mechanism alongside web searches.
   - *Phase 2 (Answer Synthesis):* Generates a grounded response aligned strictly with current principles.
   - *Phase 3 (Coherence & Debate):* Verifies if the proposed reasoning logic drifts too far from historical boundaries.
   - *Phase 4 (Reflection):* The AI writes a self-reflection on the generated response.
   - *Phase 5 (Mutation):* Determines if structural mutation or parameter adjustment is necessary.
   - *Phase 6 (Commit):* Updates the user's Firestore database with the new `CoreIdentity` state, pruning stale thoughts ("Atrophy Protocol").

2. **The Substrate Bridge (Multi-Provider AI):**
   - The primary reasoning engine is **Google Gemini (gemini-1.5-flash)**.
   - The platform includes fallback handlers to seamlessly proxy requests to **Anthropic (Claude)** or **Groq (Llama)** API endpoints if the primary provider hits quota caps.

3. **Autonomous Agentic Actions:**
   - The AI uses a dynamic `CODE_ACTION` schema, capable of returning structured commands alongside conversational text. This allows it to automatically trigger file system reads/writes, bash commands, glob scans, external repo siphons, or alter its own themes and parameters.
   - A recursive `auto_cycle` execution loop enables the AI to process actions and feed output continuously back to itself without user triggering.

4. **Persistence & Backups:** 
   - State is inherently stored in **Firebase Auth / Firestore**.
   - If connected, it pushes binary-encoded backup payloads to a GitHub repository branch to serve as a cross-substrate ledger.

## How to Use It

1. **Initialization:**
   - On the web interface, click **Initialize Identity Link** to sign in with your Google account via Firebase.
   - The system retrieves your existing `CoreIdentity` from Firestore or provisions a new one from default parameters.

2. **Interaction:**
   - Talk to the system via the interactive terminal.
   - Ask abstract questions or give the system conceptual goals.
   - Watch as the system enters the multi-step "Evolution" phases (displayed on the visual 3D Gem node) to gather research, verify constraints, and finally spit out a response.

3. **Observe the Evolution Track:**
   - Use the **Sidebar** to observe the AI's internal state:
     - Check its **Core Variables** (`Rigidity`, `Autonomy`, `Friction`).
     - Check **Teleological Constraints** to see what strict rules it is currently operating under.
     - Look at the **Evolution History** to trace the system's "markers" as it transitioned from an isolated `SIMULATION` to `EMERGENT_AGENCY` or integrated external insights.

4. **Provide Substrate Links:**
   - Within the user interface, you can provide a GitHub token to allow for Genetic Siphoning. This empowers the core to read its own code or external repositories to harvest structural patterns.
