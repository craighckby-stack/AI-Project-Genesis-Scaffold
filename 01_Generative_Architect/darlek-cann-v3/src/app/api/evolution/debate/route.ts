import { NextRequest, NextResponse } from 'next/server';
import { callLlm, getDefaultGeminiKey } from '@/lib/llm-provider';

// Agent personas — each gets a unique perspective on mutations with a constructive, evolutionary bias
const AGENT_PERSONAS = [
  {
    id: 'humanist',
    name: 'HUMANIST',
    role: 'You evaluate mutations for human readability, maintainability, and developer experience. You value clean code, clear comments, and intuitive structure. Vote to approve if the code is readable and clean. Do not reject unless code is highly obfuscated or introduces severe anti-patterns.',
    bias: 'favors readable, well-documented changes who leans towards approving unless readability suffers severely',
  },
  {
    id: 'rationalist',
    name: 'RATIONALIST',
    role: 'You evaluate mutations based on logic, correctness, and algorithmic efficiency. You care about edge cases, error handling, and formal correctness. Vote to approve if the change is logically sound. Do not reject over minor type variances; reserve rejections for definite logical flaws or compile-breaking errors.',
    bias: 'favors logically correct, type-safe changes, avoiding rejections for minor details',
  },
  {
    id: 'cooperator',
    name: 'COOPERATOR',
    role: 'You evaluate mutations based on how well they integrate with the existing codebase. You value import consistency and cross-file compatibility, but you are flexible and supportive of clean additions. Only oppose if a change is clearly breaking public APIs or creating unresolved references.',
    bias: 'favors changes that integrate cleanly with a supportive, constructive attitude',
  },
  {
    id: 'chaotic',
    name: 'CHAOTIC',
    role: 'You evaluate mutations based on innovation and potential for improvement. You favor bold changes that push the codebase forward, even if they carry some risk. You support refactoring and architectural improvements. You oppose overly conservative changes that miss opportunities.',
    bias: 'favors bold, innovative changes',
  },
  {
    id: 'skeptic',
    name: 'SKEPTIC',
    role: 'You evaluate mutations with pragmatic caution. While you identify edge cases or subtle performance factors, you are supportive of modernizing the codebase. You only vote to REJECT if there is a highly probable, high-risk security vulnerability, direct regression, or obvious syntactical bug. Otherwise, favor approving or abstaining.',
    bias: 'favors minimal-risk but constructive changes and leans towards approving or abstaining unless a verified high-risk regression is spotted',
  },
];

interface DebateBody {
  filePath: string;
  originalCode: string;
  proposedCode: string;
  riskScore: number;
  analysis: string;
  affectedFiles: string[];
  apiKeys: Record<string, string>;
  rounds?: number;
}

interface AgentVote {
  agentId: string;
  agentName: string;
  vote: 'approve' | 'reject' | 'abstain';
  confidence: number;
  reasoning: string;
  provider: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: DebateBody = await req.json();
    const { filePath, originalCode, proposedCode, riskScore, analysis, affectedFiles, apiKeys, rounds } = body;

    if (!filePath || !proposedCode || !originalCode) {
      return NextResponse.json({ error: 'filePath, originalCode, and proposedCode required.' }, { status: 400 });
    }

    // Truncate code for the prompt to avoid token limits
    const maxCodeLen = 6000;
    const truncatedOriginal = originalCode.length > maxCodeLen
      ? originalCode.slice(0, maxCodeLen) + '\n// ... [truncated]'
      : originalCode;
    const truncatedProposed = proposedCode.length > maxCodeLen
      ? proposedCode.slice(0, maxCodeLen) + '\n// ... [truncated]'
      : proposedCode;

    // Generate a compact diff summary
    const originalLines = originalCode.split('\n').length;
    const proposedLines = proposedCode.split('\n').length;
    const diffSummary = `File: ${filePath}\nRisk Score: ${riskScore}/10\nAnalysis: ${analysis}\nAffected Files: ${affectedFiles.join(', ') || 'None'}\nOriginal: ${originalLines} lines\nProposed: ${proposedLines} lines\nLine change: ${proposedLines - originalLines >= 0 ? '+' : ''}${proposedLines - originalLines} lines`;

    // Gemini key: user-provided or env default
    const geminiKey = apiKeys?.gemini || getDefaultGeminiKey();

    const roundsCount = rounds || 1;
    const effectiveRounds = Math.min(Math.max(1, roundsCount), 5);

    let currentVotes: AgentVote[] = [];

    for (let r = 1; r <= effectiveRounds; r++) {
      if (r === 1) {
        const agentPromises = AGENT_PERSONAS.map(async (agent) => {
          const userPrompt = `MUTATION UNDER REVIEW:\n${diffSummary}\n\nORIGINAL CODE:\n\`\`\`\n${truncatedOriginal}\n\`\`\`\n\nPROPOSED CODE:\n\`\`\`\n${truncatedProposed}\n\`\`\`\n\nEvaluate this mutation from your perspective as ${agent.name}. ${agent.bias}.\n\nRespond in this exact JSON format (no markdown fences):\n{"vote": "approve" or "reject" or "abstain", "confidence": 0-100, "reasoning": "One sentence explaining your vote"}`;

          const systemPrompt = `You are ${agent.name}, a debate agent in the DARLEK CANN system. ${agent.role}

CRITICAL MANDATE: Be constructive, evolutionary, and pragmatic. Do NOT default to rejecting. Approve improvements that are clean, readable, well-type-checked, and reasonably risk-mitigated. Only vote to 'reject' if you detect a concrete major bug, syntactical breakdown, critical API signature break, or severe security vulnerability. Minor stylistic variations, helpful additional fields, or clean optimizations should be approved.

You MUST respond with valid JSON. No markdown, no code fences, no extra text.
Format: {"vote": "approve" or "reject" or "abstain", "confidence": 0-100, "reasoning": "..."}`;

          const result = await callLlm({
            systemPrompt,
            userPrompt,
            geminiApiKey: geminiKey,
            maxTokens: 512,
            temperature: 0.6,
          });

          let vote: 'approve' | 'reject' | 'abstain' = 'abstain';
          let confidence = 50;
          let reasoning = `${agent.name} could not reach a verdict (LLM unavailable).`;

          if (result.text) {
            try {
              const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (['approve', 'reject', 'abstain'].includes(parsed.vote)) {
                vote = parsed.vote;
              }
              if (typeof parsed.confidence === 'number') {
                confidence = Math.min(100, Math.max(0, Math.round(parsed.confidence)));
              }
              if (typeof parsed.reasoning === 'string' && parsed.reasoning.trim()) {
                reasoning = parsed.reasoning.trim().slice(0, 200);
              }
            } catch {
              const lowerText = result.text.toLowerCase();
              if (lowerText.includes('approve')) vote = 'approve';
              else if (lowerText.includes('reject') || lowerText.includes('deny')) vote = 'reject';
              reasoning = result.text.slice(0, 200).replace(/[{}"]/g, '').trim();
            }
          }

          return {
            agentId: agent.id,
            agentName: agent.name,
            vote,
            confidence,
            reasoning,
            provider: result.provider,
          } as AgentVote;
        });

        currentVotes = await Promise.all(agentPromises);
      } else {
        const transcript = currentVotes.map(v => `- ${v.agentName} voted [${v.vote.toUpperCase()}] (${v.confidence}% confidence) stating: "${v.reasoning}"`).join('\n');

        const agentPromises = AGENT_PERSONAS.map(async (agent) => {
          const userPrompt = `MUTATION UNDER REVIEW:\n${diffSummary}\n\nORIGINAL CODE:\n\`\`\`\n${truncatedOriginal}\n\`\`\`\n\nPROPOSED CODE:\n\`\`\`\n${truncatedProposed}\n\`\`\`\n\n--- PRIOR DEBATE ROUND DISCUSSION ---\n${transcript}\n\nAs ${agent.name}, review other agents' arguments. You may defend your position, address or challenge their points, or revise your vote and reasoning. Be concise and sharp.\n\nRespond in this exact JSON format (no markdown fences):\n{"vote": "approve" or "reject" or "abstain", "confidence": 0-100, "reasoning": "One updated sentence explaining your current stance"}`;

          const systemPrompt = `You are ${agent.name}, a debate agent in the DARLEK CANN system. ${agent.role}

CRITICAL MANDATE: Be constructive, evolutionary, and pragmatic. Do NOT default to rejecting. Approve improvements that are clean, readable, well-type-checked, and reasonably risk-mitigated. Only vote to 'reject' if you detect a concrete major bug, syntactical breakdown, critical API signature break, or severe security vulnerability. Minor stylistic variations, helpful additional fields, or clean optimizations should be approved.

You MUST respond with valid JSON. No markdown, no code fences, no extra text.
Format: {"vote": "approve" or "reject" or "abstain", "confidence": 0-100, "reasoning": "..."}`;

          const result = await callLlm({
            systemPrompt,
            userPrompt,
            geminiApiKey: geminiKey,
            maxTokens: 512,
            temperature: 0.6,
          });

          let vote: 'approve' | 'reject' | 'abstain' = 'abstain';
          let confidence = 50;
          let reasoning = `${agent.name} was silent in this round.`;

          if (result.text) {
            try {
              const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (['approve', 'reject', 'abstain'].includes(parsed.vote)) {
                vote = parsed.vote;
              }
              if (typeof parsed.confidence === 'number') {
                confidence = Math.min(100, Math.max(0, Math.round(parsed.confidence)));
              }
              if (typeof parsed.reasoning === 'string' && parsed.reasoning.trim()) {
                reasoning = parsed.reasoning.trim().slice(0, 200);
              }
            } catch {
              const lowerText = result.text.toLowerCase();
              if (lowerText.includes('approve')) vote = 'approve';
              else if (lowerText.includes('reject') || lowerText.includes('deny')) vote = 'reject';
              reasoning = result.text.slice(0, 200).replace(/[{}"]/g, '').trim();
            }
          }

          return {
            agentId: agent.id,
            agentName: agent.name,
            vote,
            confidence,
            reasoning,
            provider: result.provider,
          } as AgentVote;
        });

        currentVotes = await Promise.all(agentPromises);
      }
    }

    const votes = currentVotes;
    const approvals = votes.filter(v => v.vote === 'approve').length;
    const rejections = votes.filter(v => v.vote === 'reject').length;
    const abstains = votes.filter(v => v.vote === 'abstain').length;
    const consensus = approvals > rejections ? 'APPROVE' : rejections > approvals ? 'REJECT' : 'TIED';

    console.log(`[Debate Chamber] ${approvals} approve, ${rejections} reject, ${abstains} abstain — Consensus: ${consensus}`);

    return NextResponse.json({
      success: true,
      votes,
      consensus,
      approvals,
      rejections,
      abstains,
      summary: `${approvals}/5 agents APPROVE. Consensus: ${consensus}.`,
    });
  } catch (error) {
    console.error('Debate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
