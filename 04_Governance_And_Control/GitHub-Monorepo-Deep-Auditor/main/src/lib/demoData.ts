import { RepoInfo } from "../types";

export const demoInventory: RepoInfo[] = [
  {
    name: "AetherForge-2.0",
    url: "https://github.com/craighckby-stack/AetherForge-2.0",
    description: "World simulator and training environment for cognitive evolutionary agents.",
    category: "AETHER-FORGE",
    language: "TypeScript",
    default_branch: "main",
    branches_count: 2,
    branches: ["main", "Old"],
    primary_stack: "Vite / React + HTML Frontend",
    is_multi_system: false,
    subsystems: [],
    updated_at: "2026-07-03T10:00:00Z",
    code_snippets: {
      "src/components/PlanetMap.tsx": "export function PlanetMap() { return <div>Planet Map Node Grid</div>; }"
    }
  },
  {
    name: "Balanced_Auditor_v5.2",
    url: "https://github.com/craighckby-stack/Balanced_Auditor_v5.2",
    description: "Consolidated theoretical and empirical review ledger with tree flattening.",
    category: "BOOKS/DOCS",
    language: "Markdown",
    default_branch: "main",
    branches_count: 10,
    branches: ["main", "backup-6obqk", "backup-c1nkp", "backup-wfvbw", "logic-backup-2y1o"],
    primary_stack: "Unknown",
    is_multi_system: false,
    subsystems: [],
    updated_at: "2026-07-06T12:00:00Z",
    code_snippets: {
      "README.md": "# Balanced Auditor\nEmpirical validation ledger."
    }
  },
  {
    name: "claud-ios",
    url: "https://github.com/craighckby-stack/claud-ios",
    description: "Vite/React frontend client for Claud-IOS agent monitoring.",
    category: "BOOKS/DOCS",
    language: "TypeScript",
    default_branch: "main",
    branches_count: 1,
    branches: ["main"],
    primary_stack: "Vite / React + HTML Frontend",
    is_multi_system: false,
    subsystems: [],
    updated_at: "2026-07-10T14:30:00Z",
    code_snippets: {}
  },
  {
    name: "ai_evo_sim",
    url: "https://github.com/craighckby-stack/ai_evo_sim",
    description: "AI evolution simulator with integrated epistemic debate chamber.",
    category: "DARLEK-CAAN",
    language: "TypeScript",
    default_branch: "main",
    branches_count: 1,
    branches: ["main"],
    primary_stack: "Full Stack (Decoupled)",
    is_multi_system: true,
    subsystems: ["Frontend Dir", "Backend Dir"],
    updated_at: "2026-06-30T09:00:00Z",
    code_snippets: {}
  },
  {
    name: "EMG-CORE",
    url: "https://github.com/craighckby-stack/EMG-CORE",
    description: "Advanced cognitive memory core and synaptic link network.",
    category: "DARLEK-CAAN",
    language: "TypeScript",
    default_branch: "main",
    branches_count: 4,
    branches: ["main", "V1", "4", "5"],
    primary_stack: "Vite / React + HTML Frontend",
    is_multi_system: false,
    subsystems: [],
    updated_at: "2026-06-28T18:45:00Z",
    code_snippets: {
      "src/lib/core/Brain.ts": "export class Brain { synapses = []; constructor() { console.log('Neural Brain Init'); } }"
    }
  },
  {
    name: "AGI-KERNEL-",
    url: "https://github.com/craighckby-stack/AGI-KERNEL-",
    description: "Self-bootstrapping foundational core kernel for AGI operations.",
    category: "HUXLEY",
    language: "Python",
    default_branch: "main",
    branches_count: 5,
    branches: ["main", "enhanced-by-brain", "logic-backup-osim"],
    primary_stack: "Unknown",
    is_multi_system: false,
    subsystems: [],
    updated_at: "2026-07-07T08:15:00Z",
    code_snippets: {}
  },
  {
    name: "DNA-Based-Regulator-Core",
    url: "https://github.com/craighckby-stack/DNA-Based-Regulator-Core",
    description: "Low-level genetic algorithm regulator for cognitive restraint and ethics.",
    category: "HUXLEY",
    language: "Go",
    default_branch: "main",
    branches_count: 7,
    branches: ["main", "core/dna-thinking-regulator", "enhanced-by-brain"],
    primary_stack: "Unknown",
    is_multi_system: false,
    subsystems: [],
    updated_at: "2026-07-07T11:20:00Z",
    code_snippets: {}
  },
  {
    name: "SOVEREIGN-",
    url: "https://github.com/craighckby-stack/SOVEREIGN-",
    description: "Meta-governance self-refactoring orchestrator and dashboard.",
    category: "SOVEREIGN",
    language: "TypeScript",
    default_branch: "main",
    branches_count: 2,
    branches: ["main", "V1"],
    primary_stack: "Vite / React + HTML Frontend",
    is_multi_system: false,
    subsystems: [],
    updated_at: "2026-07-08T16:00:00Z",
    code_snippets: {}
  },
  {
    name: "GROG-The-First-Learning-AGI",
    url: "https://github.com/craighckby-stack/GROG-The-First-Learning-AGI",
    description: "Self-evolving neural network prototype utilizing contextual learning.",
    category: "GROG",
    language: "Python",
    default_branch: "main",
    branches_count: 12,
    branches: ["main", "dk-enhancer", "enhanced-by-brain"],
    primary_stack: "Unknown",
    is_multi_system: false,
    subsystems: [],
    updated_at: "2026-06-27T10:00:00Z",
    code_snippets: {}
  }
];

export const demoBranchMap: Record<string, string[]> = {
  "AetherForge-2.0": ["main", "Old"],
  "Balanced_Auditor_v5.2": ["main", "backup-6obqk", "backup-c1nkp", "backup-wfvbw", "logic-backup-2y1o"],
  "claud-ios": ["main"],
  "ai_evo_sim": ["main"],
  "EMG-CORE": ["main", "V1", "4", "5"],
  "AGI-KERNEL-": ["main", "enhanced-by-brain", "logic-backup-osim"],
  "DNA-Based-Regulator-Core": ["main", "core/dna-thinking-regulator", "enhanced-by-brain"],
  "SOVEREIGN-": ["main", "V1"],
  "GROG-The-First-Learning-AGI": ["main", "dk-enhancer", "enhanced-by-brain"]
};

export const demoFileRegistry: [string, {repo: string, path: string}[]][] = [
  ["5a86d2a8aeff...", [
    { repo: "SOVEREIGN-", path: ".gitignore" },
    { repo: "claud-ios", path: ".gitignore" },
    { repo: "EMG-CORE", path: ".gitignore" },
    { repo: "AetherForge-2.0", path: ".gitignore" }
  ]],
  ["080dac371e6d...", [
    { repo: "SOVEREIGN-", path: "src/main.tsx" },
    { repo: "claud-ios", path: "src/main.tsx" },
    { repo: "EMG-CORE", path: "src/main.tsx" }
  ]],
  ["d88f175b0882...", [
    { repo: "AetherForge-2.0", path: "tsconfig.json" },
    { repo: "SOVEREIGN-", path: "tsconfig.json" },
    { repo: "EMG-CORE", path: "tsconfig.json" }
  ]]
];

export const demoReconData = [
  {
    name: "EMG-CORE",
    owner: "craighckby-stack",
    interDependencies: ["AetherForge-2.0", "SOVEREIGN-"],
    externalDependencies: ["react", "vite", "motion", "lucide-react"],
    branches: [
      { name: "main", lastCommitDate: "2026-06-28T18:45:00Z", lastCommitAuthor: "Craighckby", isDormant: false, isDefault: true },
      { name: "V1", lastCommitDate: "2026-05-15T12:00:00Z", lastCommitAuthor: "Craighckby", isDormant: true, isDefault: false }
    ],
    pullRequests: [
      { number: 42, title: "feat: add EMG-Memory synapsing metrics", state: "open", author: "Craighckby", createdAt: "2026-06-25T11:00:00Z", hasWorkflows: true, workflows: [{ name: "build-and-test", status: "completed", conclusion: "success" }] }
    ],
    architecturalDebt: {
      score: 18,
      riskLevel: "Low",
      factors: ["Dormant branches mapping detected", "Clean package dependencies"]
    }
  },
  {
    name: "AetherForge-2.0",
    owner: "craighckby-stack",
    interDependencies: [],
    externalDependencies: ["react", "vite", "@google/genai"],
    branches: [
      { name: "main", lastCommitDate: "2026-07-03T10:00:00Z", lastCommitAuthor: "Craighckby", isDormant: false, isDefault: true }
    ],
    pullRequests: [],
    architecturalDebt: {
      score: 5,
      riskLevel: "Very Low",
      factors: ["No stale pull requests"]
    }
  },
  {
    name: "SOVEREIGN-",
    owner: "craighckby-stack",
    interDependencies: ["EMG-CORE"],
    externalDependencies: ["react", "vite", "express"],
    branches: [
      { name: "main", lastCommitDate: "2026-07-08T16:00:00Z", lastCommitAuthor: "Craighckby", isDormant: false, isDefault: true }
    ],
    pullRequests: [],
    architecturalDebt: {
      score: 12,
      riskLevel: "Low",
      factors: ["Clean self-refactoring schema configurations"]
    }
  }
];

export const demoAutoInjectSuggestions = [
  {
    filePath: "vite.config.ts",
    explanation: "Fix API Key leak vector by routing model requests through server-side endpoints instead of directly compiling secrets into client bundles.",
    content: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Secure configuration - Removed definitions that leak sensitive environment variables to the client bundle
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});`
  },
  {
    filePath: "src/lib/utils.ts",
    explanation: "Implement secure and verified utility functions for state signing and metadata hashing with SHA-256 standard cryptographic library, preventing collision vectors in system deduplication tasks.",
    content: `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function generateCryptographicSignature(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}`
  }
];

export const demoFileContents: Record<string, string> = {
  "HUXLEY_META_MAP.md": `# Huxley Meta-Analysis: Deep Concept Map

## Overview
This Huxley Meta-Analysis synthesizes the overarching conceptual architecture derived from the provided repository portfolio. It maps out the intricate interdependencies and conceptual interlocks, centering on the ambitious vision of the "Huxley" AGI Framework.

### Macroscopic Technical Vectors
1. **AI/AGI as a Foundational Pursuit:** The explicit objective is the creation of Artificial General Intelligence, encompassing consciousness, reasoning, memory, and self-improvement, as described by the "OMEGA" architecture.
2. **Evolutionary & Self-Modifying Systems:** Dalek Caan is designed to generate, optimize, and evolve other codebases and itself.
3. **Ethical AI & Robust Governance:** Safer-Growing-Intelligence ("Baby AGI") and The Dopaminergic Brake enforce control layers.
4. **Simulation-Driven Development:** AetherForge provides the world sim environments for autonomous training.`,

  "DARLEK_CAAN_ANALYSIS.md": `# Darlek Caan Code Enhancement & Next Steps

This codebase exhibits the hallmarks of rapid, iterative development. Our analysis reveals extreme code duplication, inconsistent configuration, and critical security vulnerabilities that must be addressed:

## Security Enhancements
- **API Key Leak Vector:** Do not define client-side Gemini tokens in Vite configs. Force all requests through secure Express backend proxies.
- **Overly Permissive CORS:** Restrict wildcard origins and specify trusted local client scopes.
- **Granular Request Verification:** Add schema validators (such as Zod) to secure API inputs and restrict request payload volumes.`,

  "CONSOLIDATION_PLAN.md": `# Monorepo Consolidation Plan & Architecture Strategy

## Suggested Monorepo Structure
\`\`\`text
huxley-monorepo/
├── apps/
│   ├── aetherforge/          # Simulation environments
│   ├── darlek-caan/          # Evolutionary engines
│   └── sovereign/            # Governance dashboards
├── packages/
│   ├── ui-core/              # Common components
│   ├── ai-sdk/               # Shared Google GenAI clients
│   └── security-guard/       # Content masking & redaction utilities
├── tools/
│   └── ci-workflows/         # Unified Github Action runners
└── docs/
    └── books/                # Academic engineering libraries
\`\`\``
};
