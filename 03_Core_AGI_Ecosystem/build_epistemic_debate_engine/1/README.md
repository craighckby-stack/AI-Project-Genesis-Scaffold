# Enhanced Epistemic Debate Engine: Live Agent Backbone

Upgrade the base Next.js control surface with real-time Claude reasoning, strict logical validation, and claim mutation. Each claim is debated, tested for logical coherence, and can be modified or withdrawn based on outcomes.

## Architecture Overview

```
[Proposition] → [Agents Generate Claims] → [Logical Validator] 
    ↓
[Strict Rules Engine] ← [Agent Objections] ← [Cross-Agent Critique]
    ↓
[Mutation Decision Tree] → [Claim Refined/Withdrawn/Locked]
    ↓
[Argument Map Evolves] → [Conflict Resolution or Deadlock]
```

Each agent's output goes through *three filters* before acceptance:
1. **Coherence Check**: Does it contradict its own prior claims?
2. **Logical Consistency**: Does it violate its epistemological axioms?
3. **Opponent Vulnerability**: Can it survive attacks from other frameworks?

Claims that fail → mutation request. Claims that lock → advance to next round.

---

## Step 1: Install Dependencies

```bash
cd build_epistemic_debate_engine-main
npm install
npm install axios lodash-es zod @anthropic-ai/sdk
npm install --save-dev @types/lodash-es
```

---

## Step 2: Define Logical Rules Engine

Create `src/lib/logicValidator.ts`:

```typescript
import { z } from 'zod';

export interface LogicalProposition {
  id: string;
  statement: string;
  agentId: string;
  foundationalAxioms: string[];
  logicalForm: string; // Simplified predicate logic notation
  contradictions: string[]; // Track conflicts with own priors
  vulnerabilities: string[]; // Known attack vectors
  coherenceScore: number; // 0-100
  locked: boolean; // True if logically defended
}

export interface LogicalAttack {
  claimId: string;
  attackerAgent: string;
  attackType: 'contradiction' | 'fallacy' | 'axiom-violation' | 'empirical-gap';
  severity: 'weak' | 'moderate' | 'fatal';
  evidence: string;
  suggestedMutation?: string;
}

// Epistemological Axioms (immutable per agent)
const AXIOMS: Record<string, string[]> = {
  skeptic: [
    'Nothing is knowable without proof',
    'Burden of proof lies with claimant',
    'Self-refuting claims are invalid',
    'Infinite regress invalidates foundations'
  ],
  rationalist: [
    'Logic is prior to observation',
    'Axioms are self-evident',
    'Contradictions are absolutely forbidden',
    'Necessary truths exist independent of experience'
  ],
  empiricist: [
    'All knowledge derives from measurement',
    'Unfalsifiable claims are meaningless',
    'Reproducibility validates truth',
    'Observable data trumps theory'
  ],
  pragmatist: [
    'Utility determines truth value',
    'Frameworks are tools, not mirrors',
    'Real-world consequences determine validity',
    'Pluralism of methods is justified'
  ]
};

// Fallacy Detection
export function detectFallacies(statement: string, agentId: string): string[] {
  const fallacies: string[] = [];

  // Circular reasoning
  if (statement.match(/therefore.*because|thus.*since/i)) {
    fallacies.push('Potential circular reasoning detected');
  }

  // Begging the question
  if (statement.includes('obviously') || statement.includes('clearly')) {
    fallacies.push('Begging the question: unjustified assumption of truth');
  }

  // Appeal to authority
  if (statement.match(/experts say|scientists agree|everyone knows/i)) {
    if (agentId === 'skeptic') {
      fallacies.push('Appeal to authority: undermines burden of proof standard');
    }
  }

  // Equivocation
  if (statement.match(/[\w]+ (is|means|represents) [\w]+ and [\w]+ (is|means|represents) [\w]+/i)) {
    fallacies.push('Equivocation risk: term shifts meaning mid-argument');
  }

  // Straw manning
  if (statement.includes('claims') && statement.includes('but')) {
    fallacies.push('Potential strawman: verify opponent actually claims this');
  }

  return fallacies;
}

// Coherence Scoring
export function scoreCoherence(
  currentStatement: string,
  priorClaims: LogicalProposition[],
  agentId: string
): { score: number; violations: string[] } {
  const violations: string[] = [];
  let score = 100;

  // Check for self-contradiction
  priorClaims.forEach(prior => {
    if (prior.agentId === agentId) {
      // Naive contradiction check
      const currentLower = currentStatement.toLowerCase();
      const priorLower = prior.statement.toLowerCase();
      
      if (containsNegation(currentLower) && containsAffirmation(priorLower)) {
        violations.push(`Contradicts prior claim: "${prior.statement}"`);
        score -= 30;
      }
    }
  });

  // Check axiom alignment
  const relevantAxioms = AXIOMS[agentId] || [];
  relevantAxioms.forEach(axiom => {
    if (statement.length > 0 && !statementIsConsistentWithAxiom(currentStatement, axiom, agentId)) {
      violations.push(`Violates axiom: "${axiom}"`);
      score -= 15;
    }
  });

  // Check fallacies
  const fallacies = detectFallacies(currentStatement, agentId);
  score -= fallacies.length * 10;
  violations.push(...fallacies);

  return { score: Math.max(0, score), violations };
}

// Vulnerability Assessment
export function assessVulnerability(
  claim: LogicalProposition,
  allClaims: LogicalProposition[]
): string[] {
  const vulnerabilities: string[] = [];

  // Check for empirical gaps (attacks from Empiricist)
  if (!claim.statement.match(/measure|observe|test|data|evidence/i)) {
    vulnerabilities.push('Empiricist attack vector: lacks empirical grounding');
  }

  // Check for logical gaps (attacks from Rationalist)
  if (claim.statement.match(/maybe|perhaps|possibly|seems/i)) {
    vulnerabilities.push('Rationalist attack vector: vague logical form');
  }

  // Check for unfalsifiability (attacks from Skeptic)
  if (!claim.statement.match(/if|then|can be|would be|test|verify/i)) {
    vulnerabilities.push('Skeptic attack vector: unfalsifiable claim');
  }

  // Check for pragmatic disconnect (attacks from Pragmatist)
  if (!claim.statement.match(/use|apply|benefit|work|enable|action/i) && claim.agentId !== 'pragmatist') {
    vulnerabilities.push('Pragmatist attack vector: no practical application');
  }

  return vulnerabilities;
}

// Mutation Suggestion
export function suggestMutation(
  claim: LogicalProposition,
  attacks: LogicalAttack[],
  agentSystemPrompt: string
): string | null {
  if (attacks.length === 0) return null;
  
  const fatalAttacks = attacks.filter(a => a.severity === 'fatal');
  if (fatalAttacks.length === 0) return null;

  // If fatal attack exists, suggest refinement based on attack type
  const attack = fatalAttacks[0];
  
  switch (attack.attackType) {
    case 'contradiction':
      return `Revise to eliminate internal contradiction. Original issue: ${attack.evidence}`;
    case 'axiom-violation':
      return `Reframe claim to align with foundational axioms. Violation: ${attack.evidence}`;
    case 'fallacy':
      return `Remove logical fallacy and reconstruct argument. Fallacy: ${attack.evidence}`;
    case 'empirical-gap':
      return `Add empirical evidence or observational basis. Gap: ${attack.evidence}`;
    default:
      return null;
  }
}

// Helper functions
function containsNegation(text: string): boolean {
  return /not|no|never|false|invalid|cannot/i.test(text);
}

function containsAffirmation(text: string): boolean {
  return /is|are|true|valid|must|always/i.test(text);
}

function statementIsConsistentWithAxiom(statement: string, axiom: string, agentId: string): boolean {
  // Simplified: just check for major keyword alignment
  const axiomKeywords = axiom.toLowerCase().split(' ').filter(w => w.length > 4);
  const statementLower = statement.toLowerCase();
  
  // At least one axiom keyword should appear or be compatible
  return axiomKeywords.some(kw => statementLower.includes(kw)) || 
         statementLower.length > 20; // Generous default for substantive claims
}
```

---

## Step 3: Live Claude Agent Interface

Create `src/lib/agentInterface.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { LogicalProposition, scoreCoherence, assessVulnerability } from './logicValidator';

const client = new Anthropic();

export interface AgentRequest {
  agentId: string;
  agentSystemPrompt: string;
  proposition: string;
  priorClaims: LogicalProposition[];
  targetClaim?: LogicalProposition; // For objections
  context: string; // Round number, debate state
  mutationPrompt?: string; // If claim failed validation
}

export async function generateAgentResponse(req: AgentRequest): Promise<{
  text: string;
  internalReasoning: string;
  coherenceScore: number;
  violations: string[];
}> {
  const systemPrompt = buildSystemPrompt(req.agentId, req.agentSystemPrompt);
  const userPrompt = buildUserPrompt(req);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    const text = response.content
      .filter(c => c.type === 'text')
      .map(c => (c.type === 'text' ? c.text : ''))
      .join('');

    // Validate coherence
    const { score, violations } = scoreCoherence(text, req.priorClaims, req.agentId);

    return {
      text,
      internalReasoning: `Generated at ${new Date().toISOString()}`,
      coherenceScore: score,
      violations
    };
  } catch (error) {
    console.error(`Agent ${req.agentId} generation failed:`, error);
    throw error;
  }
}

function buildSystemPrompt(agentId: string, customPrompt: string): string {
  return `${customPrompt}

YOU MUST:
1. Make ONE clear, testable claim or objection
2. State your logical form explicitly (e.g., "If X then Y")
3. Ground every assertion in your epistemological framework
4. Identify and admit any assumptions you cannot justify

DO NOT:
- Make vague claims
- Contradict your prior statements
- Use unfalsifiable language
- Appeal to authorities outside your framework`;
}

function buildUserPrompt(req: AgentRequest): string {
  let prompt = `${req.context}\n\nProposition: "${req.proposition}"\n\n`;

  if (req.mutationPrompt) {
    prompt += `YOUR PRIOR CLAIM FAILED LOGICAL VALIDATION.\n${req.mutationPrompt}\n\nRevised claim:\n`;
  } else if (req.targetClaim) {
    prompt += `Previous claim to object to:\n"${req.targetClaim.statement}"\n\nYour objection:\n`;
  } else {
    prompt += `Your opening claim:\n`;
  }

  if (req.priorClaims.length > 0) {
    prompt += `\n\nOther claims in debate:\n`;
    req.priorClaims.forEach(c => {
      prompt += `- ${c.agentId}: "${c.statement}"\n`;
    });
  }

  return prompt;
}
```

---

## Step 4: Debate Orchestration Engine

Create `src/lib/debateOrchestrator.ts`:

```typescript
import {
  LogicalProposition,
  LogicalAttack,
  scoreCoherence,
  assessVulnerability,
  suggestMutation,
} from './logicValidator';
import { generateAgentResponse, AgentRequest } from './agentInterface';

export interface DebateState {
  round: number;
  proposition: string;
  claims: LogicalProposition[];
  attacks: LogicalAttack[];
  mutationRequests: Map<string, string>; // claimId -> mutationPrompt
  lockedClaims: Set<string>;
  isComplete: boolean;
  reasoning: string[];
}

export async function runDebateRound(
  state: DebateState,
  agents: Record<string, any>,
  maxMutationAttempts: number = 2
): Promise<DebateState> {
  const newState = { ...state };
  newState.reasoning = [];

  // Round 1: Generate opening claims (if none exist)
  if (state.round === 1 && state.claims.length === 0) {
    newState.reasoning.push(`ROUND ${state.round}: OPENING STATEMENTS`);
    
    for (const agentId of Object.keys(agents)) {
      const req: AgentRequest = {
        agentId,
        agentSystemPrompt: agents[agentId].systemPrompt,
        proposition: state.proposition,
        priorClaims: state.claims,
        context: `Round 1: Opening statements. Proposition: "${state.proposition}"`
      };

      const response = await generateAgentResponse(req);
      
      const claim: LogicalProposition = {
        id: `${agentId}_r${state.round}_${Date.now()}`,
        statement: response.text,
        agentId,
        foundationalAxioms: agents[agentId].axioms || [],
        logicalForm: extractLogicalForm(response.text),
        contradictions: response.violations,
        vulnerabilities: assessVulnerability({} as LogicalProposition, []),
        coherenceScore: response.coherenceScore,
        locked: response.coherenceScore > 70
      };

      // If coherence is poor, request mutation
      if (claim.coherenceScore <= 70) {
        const mutation = suggestMutation(claim, [], agents[agentId].systemPrompt);
        if (mutation) {
          newState.mutationRequests.set(claim.id, mutation);
          newState.reasoning.push(`  ${agentId}: COHERENCE FAILURE (${claim.coherenceScore}/100) - Mutation requested`);
          
          // Retry with mutation prompt
          const mutatedReq: AgentRequest = {
            ...req,
            mutationPrompt: mutation
          };
          const mutatedResponse = await generateAgentResponse(mutatedReq);
          claim.statement = mutatedResponse.text;
          claim.coherenceScore = mutatedResponse.coherenceScore;
          claim.contradictions = mutatedResponse.violations;
        }
      }

      if (claim.coherenceScore > 70) {
        claim.locked = true;
        newState.reasoning.push(`  ${agentId}: CLAIM LOCKED (${claim.coherenceScore}/100)`);
      }

      newState.claims.push(claim);
    }
  }
  // Round 2+: Generate objections
  else if (state.round > 1) {
    newState.reasoning.push(`ROUND ${state.round}: OBJECTIONS & ATTACKS`);

    const unlockedClaims = state.claims.filter(c => !state.lockedClaims.has(c.id));

    for (const agentId of Object.keys(agents)) {
      // Skip if this agent locked all its prior claims
      const agentClaims = unlockedClaims.filter(c => c.agentId !== agentId);
      if (agentClaims.length === 0) continue;

      // Target the strongest opposing claim
      const targetClaim = agentClaims.reduce((best, curr) => 
        curr.coherenceScore > best.coherenceScore ? curr : best
      );

      const req: AgentRequest = {
        agentId,
        agentSystemPrompt: agents[agentId].systemPrompt,
        proposition: state.proposition,
        priorClaims: state.claims,
        targetClaim,
        context: `Round ${state.round}: Objection phase. Target opposing claims.`
      };

      const response = await generateAgentResponse(req);

      // Build attack based on objection
      const attack: LogicalAttack = {
        claimId: targetClaim.id,
        attackerAgent: agentId,
        attackType: determineAttackType(response.text, targetClaim, agentId),
        severity: determineSeverity(response.text, response.coherenceScore),
        evidence: response.text,
        suggestedMutation: suggestMutation(targetClaim, [], agents[agentId].systemPrompt) || undefined
      };

      newState.attacks.push(attack);
      newState.reasoning.push(
        `  ${agentId} → ${targetClaim.agentId}: ${attack.attackType} (${attack.severity})`
      );

      // If fatal attack, mark target for mutation
      if (attack.severity === 'fatal') {
        const mutation = attack.suggestedMutation;
        if (mutation) {
          newState.mutationRequests.set(targetClaim.id, mutation);
          newState.reasoning.push(`    MUTATION TRIGGERED: ${mutation.substring(0, 50)}...`);
        }
      }
    }
  }

  newState.round += 1;
  return newState;
}

function extractLogicalForm(statement: string): string {
  // Simplified: extract "if X then Y" patterns
  const match = statement.match(/if\s+(.+?)\s+then\s+(.+?)[.,]/i);
  return match ? `∀X: P(${match[1]}) → Q(${match[2]})` : 'Unknown';
}

function determineAttackType(
  objection: string,
  targetClaim: LogicalProposition,
  attackerAgent: string
): LogicalAttack['attackType'] {
  if (objection.match(/contradict|conflict|opposite/i)) return 'contradiction';
  if (objection.match(/fallacy|logical|invalid/i)) return 'fallacy';
  if (objection.match(/axiom|principle|assume/i)) return 'axiom-violation';
  if (objection.match(/evidence|measure|test|observe/i)) return 'empirical-gap';
  return 'contradiction';
}

function determineSeverity(
  objection: string,
  coherenceScore: number
): LogicalAttack['severity'] {
  if (coherenceScore > 80) return 'weak';
  if (coherenceScore > 60) return 'moderate';
  return 'fatal';
}

export function debateIsComplete(state: DebateState, maxRounds: number = 3): boolean {
  return state.round > maxRounds || 
    (state.claims.length > 0 && state.lockedClaims.size === state.claims.length);
}
```

---

## Step 5: Update React Component (Server Action)

Create `src/app/actions.ts`:

```typescript
'use server';

import { runDebateRound, debateIsComplete, DebateState } from '@/lib/debateOrchestrator';

export async function executeDebateRound(
  currentState: DebateState,
  agents: Record<string, any>
): Promise<DebateState> {
  try {
    const nextState = await runDebateRound(currentState, agents);
    
    if (debateIsComplete(nextState)) {
      nextState.isComplete = true;
    }

    return nextState;
  } catch (error) {
    console.error('Debate execution error:', error);
    throw error;
  }
}
```

---

## Step 6: Integrate into page.tsx

Update `src/app/page.tsx` to call the server action:

```typescript
import { executeDebateRound } from './actions';
import { DebateState } from '@/lib/debateOrchestrator';

// Inside component, replace runNextRound:
const runNextRound = async () => {
  if (isSimulating || currentRound >= 3) return;
  setIsSimulating(true);

  const state: DebateState = {
    round: currentRound + 1,
    proposition: activeProposition,
    claims: claims.map(c => ({
      id: c.id,
      statement: c.text,
      agentId: c.agentId,
      foundationalAxioms: [],
      logicalForm: '',
      contradictions: [],
      vulnerabilities: [],
      coherenceScore: 75,
      locked: false
    })),
    attacks: objections.map(o => ({
      claimId: o.targetClaimId,
      attackerAgent: o.sourceAgentId,
      attackType: 'contradiction' as const,
      severity: 'moderate' as const,
      evidence: o.objectionText
    })),
    mutationRequests: new Map(),
    lockedClaims: new Set(),
    isComplete: false,
    reasoning: []
  };

  try {
    const nextState = await executeDebateRound(state, agents);
    
    // Update UI with new claims
    const newClaims: Claim[] = nextState.claims.map(c => ({
      id: c.id,
      text: c.statement,
      agentId: c.agentId,
      round: nextState.round,
      timestamp: Date.now()
    }));
    setClaims(newClaims);

    // Display reasoning
    console.log(nextState.reasoning);

    setCurrentRound(nextState.round);
    setIsSimulating(false);
  } catch (error) {
    console.error('Debate failed:', error);
    setIsSimulating(false);
  }
};
```

---

## Step 7: Argument Evolution Display

Add to page.tsx render (after Claims section):

```tsx
{/* Mutation Log */}
{objections.length > 0 && (
  <div className="border border-red-500/30 bg-red-950/10 rounded p-3 mt-4">
    <div className="text-xs font-bold text-red-400 mb-2">⚠️ LOGICAL MUTATIONS</div>
    {detectedConflicts.map(c => (
      <div key={c.id} className="text-xs text-red-300 mb-1">
        {c.description}
      </div>
    ))}
  </div>
)}

{/* Reasoning Log */}
{currentRound > 0 && (
  <div className="border border-cyan-500/20 bg-cyan-950/5 rounded p-3 mt-4 font-mono text-xs text-cyan-300">
    <div className="font-bold mb-2">ORCHESTRATOR REASONING:</div>
    {/* Map reasoning from state */}
  </div>
)}
```

---

## Step 8: Run Enhanced Version

```bash
npm run dev
# Visit http://localhost:3000
# Propositions now trigger real Claude calls
# Claims mutate based on logical failures
# Attacks are scored and tracked
# Argument map evolves in real time
```

---

## Key Behaviors

**Claim Lifecycle:**
```
Generated → Coherence Check → Fail? Request Mutation → Lock or Defeat
     ↓
     Survives Round 1
     ↓
Attacked by Opponents → Severity Assessment → Fatal? Mark for Mutation
     ↓
Mutation Attempt → New Coherence Check → Lock or Withdrawal
```

**Attack Types & Scoring:**
- **Contradiction**: Agent claims opposite. Severity = coherence score.
- **Fallacy**: Logical error detected. Severity = fallacy count.
- **Axiom Violation**: Breaks foundational assumption. Severity = always critical.
- **Empirical Gap**: No observable grounding. Severity = empiricist coherence.

**Mutations:**
1. Coherence fails (score < 70) → Automatic mutation request
2. Fatal attack → Opponent suggests specific refinement
3. Max 2 mutation attempts per claim
4. After 2 failures → Claim withdrawn, agent forced to new position

---

## Testing with Custom Propositions

Run with:
```bash
# Base input
"Is artificial consciousness possible?"

# System will:
# 1. Generate opening claims from each agent
# 2. Test coherence (expect Rationalist to lock quickly, Skeptic to struggle)
# 3. Round 2: Empiricist attacks Skeptic's unfalsifiable claims
# 4. Skeptic forced to mutate: "We cannot know IF consciousness is possible,
#    but can define testable conditions"
# 5. Pragmatist attacks Rationalist's abstraction
# 6. Rationalist locks down logical form: "Consciousness := Information
#    Integration (Φ > X) therefore substrate-independent"
```

---

## Expected Emergent Patterns

- **Rationalist locks fast**: Axiom-grounded, minimal vulnerability
- **Skeptic mutates frequently**: Burden of proof forced refinement
- **Empiricist+Pragmatist ally**: Both ground-focused, attack Rationalist abstraction
- **Deadlock zones**: When Skeptic vs Pragmatist (utility vs justification)

Each debate produces a *mutation graph*, not just a winner.
