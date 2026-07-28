# DARLEK CANN v3.0: ESLint Architectural Blueprint

## 1. Executive Summary
This document defines the mandatory linting and static analysis architecture for the DARLEK CANN v3.0 ecosystem. It enforces strict type-safety, memory leak prevention, and cognitive complexity thresholds to ensure the system remains resilient against 'code rot' during autonomous evolution.

## 2. Core Enforcement Modules

### A. Memory & Async Integrity (The 'Zero-Leak' Policy)
- **`@typescript-eslint/no-floating-promises`**: Mandatory. All async operations must be awaited or explicitly handled via `.catch()`.
- **`no-unused-vars`**: Set to `error`. Pruning dead weight is non-negotiable.
- **`@typescript-eslint/no-misused-promises`**: Prevents race conditions in `onSnapshot` or `useEffect` hooks.

### B. Cognitive Complexity Control
- **`sonarjs/cognitive-complexity`**: Threshold set to `15`. Functions exceeding this must be refactored into atomic sub-modules.
- **`sonarjs/no-duplicate-string`**: Enforces constant extraction to prevent magic-string leakage.

### C. Import Hygiene
- **`import/order`**: Enforces strict grouping: `[external, internal, parent, sibling, index]`.
- **`@typescript-eslint/consistent-type-imports`**: Enforces `import type` to optimize bundle size and prevent circular dependency loops.

## 3. Architectural Integration Schema
| Module | Dependency Requirement | Enforcement Level |
| :--- | :--- | :--- |
| `AgentOrchestra` | `strict-null-checks` | Critical |
| `QuantumData` | `no-explicit-any` | Critical |
| `UI-Components` | `tailwind-plugin` | Warning |

## 4. Implementation Blueprint (.eslintrc.json)

{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:sonarjs/recommended",
    "plugin:import/typescript"
  ],
  "rules": {
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "sonarjs/cognitive-complexity": ["error", 15],
    "import/order": ["error", { "newlines-between": "always" }]
  }
}


## 5. Evolution Protocol
Any modification to this blueprint requires a system-wide re-linting pass. The DARLEK CANN engine will automatically reject PRs that introduce 'dead weight' (unused variables) or 'floating promises' (potential memory leaks).