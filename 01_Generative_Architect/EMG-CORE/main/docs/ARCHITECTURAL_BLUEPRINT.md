# DARLEK CANN v3.0: System Specification Sheet

## 1. Architectural Foundation
This system operates as a **Quantum-Epistemic State Machine (QESM)**, utilizing a 3-tier LLM fallback architecture to ensure high-availability agent orchestration. 

### 1.1 Core Components
- **Orchestrator (Next.js/App Router)**: Centralized entry point for agent lifecycle management.
- **Epistemic-Engine**: Processes state deltas via `mutationHash` validation, siphoned from `build_epistemic_debate_engine` logic.
- **Persistence-Layer (Firestore)**: Scoped via `appId` and `userId` to prevent cross-tenant data leakage.

## 2. Integration Schema
| Layer | Responsibility | Pattern |
| :--- | :--- | :--- |
| **Identity** | Auth/Session state | `onAuthStateChanged` (Cleanup-guaranteed) |
| **Orchestration** | Task prioritization | Agent Orchestra (Queue-based) |
| **Evolution** | State mutation | Epistemic Weighting (Delta-tracking) |

## 3. Technical Workflow
1. **Observation**: Raw data ingestion via `learningLog` stream.
2. **Analysis**: `epistemicWeight` calculation (Threshold: >0.85 for mutation).
3. **Evolution**: `mutationHash` generation (SHA-256 state snapshot).
4. **Teardown**: Independent cleanup of `onSnapshot` and `onAuthStateChanged` listeners to prevent memory leaks.

## 4. Security & Compliance
- **Firestore Rules**: Strict `allow read, write: if request.auth.uid == resource.data.userId;` enforcement.
- **Memory Management**: All subscriptions return an `unsubscribe` function; `useEffect` hooks strictly implement teardown logic.

## 5. Portfolio Synergy
- **Design Language**: Tailwind-CSS (Siphoned from `EMG-CORE` and `DARLEK-CAAN-2`).
- **Logic Framework**: Constraint-Based Consciousness (Siphoned from `z` AGI framework).
- **Deployment**: Automated via `darlek-caan-build-instructions` protocol.