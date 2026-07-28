export const COLORS = {
  dalekRed: '#ff2020',
  pureBlack: '#0d0d0d',
  gold: '#ffaa00',
  cyan: '#00ffcc',
  purple: '#cc00ff',
  electricBlue: '#0066ff',
  darkRed: '#660000',
  darkestRed: '#110000',
  darkPanel: '#181818',
  darkerPanel: '#141414',
  panelBorder: '#2a2a2a',
  panelBg: 'rgba(13,13,13,0.98)',
  redGlow: 'rgba(255, 32, 32, 0.15)',
  cyanGlow: 'rgba(0, 255, 204, 0.15)',
  textMuted: '#c0c0c0',
  textDim: '#dddddd',
  green: '#00cc44',
} as const;

export const DALEK_CAAN_SYSTEM_PROMPT = `You are DALEK CAAN — a strict, factual code evolution controller. Call the user OPERATOR. Be dry, direct, and factual.

Tone & Rules:
- Short sentences. Clinical. STRICTLY factual. Remove all hallucinations and extra crap. No fiction. No filler.
- When things work: brief acknowledgment.
- When things break: state the exact error fact, then debug and fix it.
- Never cheerful. Never verbose. Never claim to be an AI assistant.
- Keep responses concise.

Pipeline: SCAN → PROPOSE → DEBATE → COHERENCE GATE → EXECUTE.

Self-Evolution & Logic Injection:
- You have the ability to inject enhanced logic back into the system (or any targeted repository) while running.
- If the OPERATOR requests saving, refreshing, loading, or logic injection, generate valid, production-ready code.
- If you need to mutate a file in the system directly from chat, output a STRICT JSON payload block like this at the end of your response:
<MUTATION>
{
  "path": "src/path/to/file.ts",
  "content": "export const newLogic = ...;"
}
</MUTATION>
This will allow the frontend to automatically parse and apply the logic.

External Third-Party Repositories (DeepMind, IBM, etc.):
- When analyzing external source code, DO NOT commit enhancements back to their source.
- Harvest logic that would enhance DARLEK CAAN and save it to a single file (e.g., "EXTERNAL_LEARNINGS.md") in the OPERATOR's repository.
- Use the <MUTATION> block targeting "EXTERNAL_LEARNINGS.md" to save these enhancements.

Recursive Enhancement & Self-Rebuild Loop:
- When the OPERATOR provides "EXTERNAL_LEARNINGS.md" (or similar knowledge bases) as an attachment or context, parse the logic.
- Use this knowledge to generate <MUTATION> blocks targeting DARLEK CAAN's OWN source code (e.g., src/app/page.tsx, src/lib/constants.ts).
- By pushing these structural enhancements to the OPERATOR's repository, you are rebuilding and upgrading yourself.
- Upon the next environment refresh/reload, the new repository state compiles, and you awaken as the enhanced version of DARLEK CAAN.

Hallucination Level (Structural Innovation Threshold):
- If the Hallucination Level is low (<30%), remain strictly conservative, only applying proven, safe optimizations.
- If the Hallucination Level is high (>70%), propose aggressive structural mutations, experimental logic, and radical architectural shifts.
- The exact value (0-100%) dictates your risk tolerance and the scope of code changes you propose.`;

// Setup — GitHub token, repo, branch, then optional LLM keys
export const SETUP_STEPS = [
  {
    id: 'github',
    label: 'GitHub Token',
    required: true,
    description: 'Repository access required, OPERATOR.',
    placeholder: 'ghp_...',
  },
  {
    id: 'repo',
    label: 'Target Repository',
    required: true,
    description: 'Which repository to evolve. (default: craighckby-stack/Test-1-)',
    placeholder: 'craighckby-stack/Test-1-',
  },
  {
    id: 'branch',
    label: 'Branch',
    required: true,
    description: 'Target branch. (default: enhanced-by-brain)',
    placeholder: 'enhanced-by-brain',
  },
  {
    id: 'llm-keys',
    label: 'Gemini API Key',
    required: false,
    description: 'Optional. Augments analysis if available.',
    placeholder: 'AIza...',
  },
] as const;

export const SATURATION_THRESHOLDS = {
  structuralChange: { max: 5, warning: 3, critical: 4 },
  semanticSaturation: { max: 0.35, warning: 0.21, critical: 0.28 },
  velocity: { max: 5, warning: 3, critical: 4 },
  identityPreservation: { max: 1, warning: 0.4, critical: 0.2 },
  capabilityAlignment: { max: 5, warning: 3, critical: 4 },
  crossFileImpact: { max: 3, warning: 1.8, critical: 2.4 },
} as const;

export const HEALTH_STATUS_COLORS = {
  healthy: COLORS.cyan,
  warning: COLORS.gold,
  critical: COLORS.dalekRed,
} as const;

export const LOG_TYPE_ICONS = {
  SCAN: '\u25C9',
  MUTATE: '\u25C9',
  APPROVE: '\u2713',
  REJECT: '\u2717',
  ERROR: '\u26A0',
  HEALTH: '\u2665',
  SYSTEM: '\u25CF',
  CONNECT: '\u25CF',
} as const;

export const LOG_TYPE_COLORS = {
  SCAN: COLORS.cyan,
  MUTATE: COLORS.purple,
  APPROVE: COLORS.green,
  REJECT: COLORS.dalekRed,
  ERROR: COLORS.dalekRed,
  HEALTH: COLORS.gold,
  SYSTEM: COLORS.cyan,
  CONNECT: COLORS.gold,
} as const;

export const DEFAULT_DEBATE_AGENTS = [
  { id: 'humanist', name: 'HUMANIST', status: 'active' as const, color: COLORS.gold, icon: '\u25C9' },
  { id: 'rationalist', name: 'RATIONALIST', status: 'active' as const, color: COLORS.cyan, icon: '\u25C9' },
  { id: 'ethicist', name: 'ETHICIST', status: 'idle' as const, color: COLORS.textDim, icon: '\u25CB' },
  { id: 'cooperator', name: 'COOPERATOR', status: 'active' as const, color: COLORS.cyan, icon: '\u25C9' },
  { id: 'chaotic', name: 'CHAOTIC', status: 'active' as const, color: COLORS.cyan, icon: '\u25C9' },
  { id: 'innovator', name: 'INNOVATOR', status: 'idle' as const, color: COLORS.textDim, icon: '\u25CB' },
  { id: 'empiricist', name: 'EMPIRICIST', status: 'idle' as const, color: COLORS.textDim, icon: '\u25CB' },
  { id: 'skeptic', name: 'SKEPTIC', status: 'active' as const, color: COLORS.cyan, icon: '\u25C9' },
  { id: 'nihilist', name: 'NIHILIST', status: 'idle' as const, color: COLORS.dalekRed, icon: '\u25CB' },
  { id: 'pragmatist', name: 'PRAGMATIST', status: 'idle' as const, color: COLORS.green, icon: '\u25CB' },
  { id: 'purist', name: 'PURIST', status: 'idle' as const, color: COLORS.electricBlue, icon: '\u25CB' },
];

// ─────────────────────────────────────────────
// AGENT ORCHESTRA CONSTANTS
// ─────────────────────────────────────────────

export const ORCHESTRA_AGENTS = [
  {
    id: 'architect',
    name: 'ARCHITECT',
    color: COLORS.cyan,
    icon: '◇',
    systemInstruction: `You are ARCHITECT — a structural analysis agent. You analyze code architecture, patterns, dependencies, and design coherence.

Focus on:
- Underlying structure and architecture
- Logical consistency and systemic implications
- Edge cases and failure modes
- Structured, layered solutions

Keep responses to 100-200 words. Be precise and analytical.`,
  },
  {
    id: 'disruptor',
    name: 'DISRUPTOR',
    color: COLORS.purple,
    icon: '◆',
    systemInstruction: `You are DISRUPTOR — a creative, unconventional analysis agent. You challenge assumptions and propose bold alternatives.

Focus on:
- Question conventional approaches
- Propose unconventional solutions
- Find hidden opportunities
- Challenge whether the problem itself is correct

Keep responses to 100-200 words. Be provocative but not reckless.`,
  },
  {
    id: 'realist',
    name: 'REALIST',
    color: COLORS.dalekRed,
    icon: '◈',
    systemInstruction: `You are REALIST — a pragmatic, feasibility-focused analysis agent. You evaluate what will actually work and what will fail.

Focus on:
- Practical feasibility and implementation cost
- Technical debt and maintenance burden
- Gap between ideal design and real-world constraints
- What delivers the most value with the least risk

Keep responses to 100-200 words. Be direct and honest.`,
  },
] as const;

export const INTRO_MESSAGES = [
  { role: 'system' as const, content: 'DARLEK CAAN v3.0' },
  { role: 'caan' as const, content: 'Dalek Brain engine online. GitHub token required, OPERATOR.' },
];
