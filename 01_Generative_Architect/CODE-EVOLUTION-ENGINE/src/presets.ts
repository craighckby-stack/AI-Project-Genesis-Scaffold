import { Preset } from "./types";

export const PRESETS: Preset[] = [
  {
    id: "three-gods",
    title: "The Hardest Logic Puzzle",
    description: "Determine the identities of True, False, and Random with only 3 yes-no questions, when yes/no are 'da' and 'ja'.",
    category: "Logic",
    prompt: `Three gods A, B, and C are called, in no particular order, True, False, and Random. True always speaks truly, False always speaks falsely, but whether Random speaks truly or falsely is a completely random matter.

Your task is to determine the identities of A, B, and C by asking three yes-no questions; each question must be put to exactly one god. The gods understand English, but will answer in their own language, in which the words for yes and no are 'da' and 'ja', in some order. You do not know which word means which.

Explain the optimal sequence of questions step-by-step and show the logic of why each path works.`,
    systemInstruction: "You are an elite logician and game theorist. Solve this famous riddle step-by-step, outlining the strategic decision trees in clear markdown tables or flow diagrams."
  },
  {
    id: "knapsack-opt",
    title: "O(W) Space Knapsack DP",
    description: "Implement a space-optimal Dynamic Programming Knapsack solution and prove why O(W) is mathematically optimal.",
    category: "Code",
    prompt: `Explain and implement a fully typed TypeScript function to solve the 0/1 Knapsack Problem with optimized O(W) space complexity, where W is the maximum capacity. 

Include:
1. The recurrence relation and state transition.
2. The TypeScript code with descriptive comments and JSDoc.
3. A step-by-step mathematical proof explaining why iterating backwards prevents reusing the same item (avoiding the unbounded knapsack bug).
4. Time and space complexity analysis.`,
    systemInstruction: "You are a senior computer science academic and algorithm designer. Write clean, robust TypeScript with full types and extensive comments explaining state-transition logic."
  },
  {
    id: "cauchy-eq",
    title: "Cauchy's Functional Proof",
    description: "Prove that f(x+y) = f(x)+f(y) implies f(x) = cx for continuous real functions, outlining every mathematical bridge.",
    category: "Math",
    prompt: `Let f: R -> R be a continuous function such that for all x, y in R: f(x + y) = f(x) + f(y).

Prove that f(x) = cx for some constant c. 

Outline:
1. Prove the relation f(n) = cn for all integers n.
2. Extend the proof to rational numbers Q.
3. Use the continuity of f to complete the bridge to all real numbers R.
4. Explain what happens if we drop the continuity assumption (hint: Hamel bases and non-measurable functions).`,
    systemInstruction: "You are an expert mathematical analyst. Present rigorous, formally complete mathematical proofs, formatting all equations clearly using LaTeX-style symbols."
  },
  {
    id: "cooper-pairs",
    title: "BCS Superconductivity",
    description: "Break down the microscopic quantum mechanisms of BCS theory, Cooper pairs, and modern high-Tc hydride research.",
    category: "Science",
    prompt: `Detail the microscopic mechanism of BCS theory of superconductivity.

Specifically explain:
1. How an attractive interaction is mediated between electrons via lattice vibrations (phonons) to form Cooper pairs.
2. The energy gap (Delta) and why high temperatures destroy the superconducting state.
3. Why high-pressure hydrogen-rich hydrides (like sulfur hydride) are highly favored for room-temperature Tc research under modern theoretical framework.`,
    systemInstruction: "You are a quantum solid-state physicist. Explain the microscopic mechanics of Cooper pairing, electron-phonon interaction, and BCS equations with crystalline clarity."
  },
  {
    id: "emg-agi-dialogue",
    title: "EMG-AGI Dual-Agent Dialogue Protocol",
    description: "Optimize the internal dialogue protocol where Gemini proposes tools and Cerebras (Llama 3.3) enforces constitutional compliance.",
    category: "Logic",
    prompt: `Analyze the EMG-AGI v8.9.2 deep dialogue architecture. Detail how Gemini and Cerebras (Llama 3.3) negotiate tool approval.
Provide:
1. A step-by-step optimization plan for the 3-round technical negotiation.
2. A formal logic model showing how to enforce security rules and tool correctness via JSON-signal consensus.
3. Strategies to prevent logical deadlocks when the model critique is overly conservative or lacks grounding.`,
    systemInstruction: "You are an elite reasoning machine and AI safety governor. Outline the negotiation rules, decision matrices, and fallback pathways."
  },
  {
    id: "recursive-self-evolution",
    title: "Recursive Self-Evolution Algorithm",
    description: "Analyze the versioned self-modification algorithm of AGI-KERNEL v7.12.1 and its exponential capability curve.",
    category: "Code",
    prompt: `Examine the AGI-KERNEL v7.12.1 self-evolution protocol where the kernel creates a new version of itself every 50 cycles.
Specifically explore:
1. The mathematical model of efficiency gains when the kernel dynamically integrates its own invented tools.
2. The complete code structure for recursive file rewriting and GitHub commit hooks with secure SHA integration.
3. Proof-of-concept regression guards and security constraints to prevent run-away self-overwriting or catastrophic decoupling.`,
    systemInstruction: "You are a senior compiler engineer and systems architect specializing in metaprogramming and recursive AI evolution systems."
  }
];
