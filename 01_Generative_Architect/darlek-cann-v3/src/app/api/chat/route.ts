import { NextRequest, NextResponse } from 'next/server';
import { callLlm, getDefaultGeminiKey } from '@/lib/llm-provider';
import { dalekBrainChat } from '@/lib/dalek-brain';
import type { ChatRequestBody } from '@/lib/types';
import { DALEK_CAAN_SYSTEM_PROMPT } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { message, history, systemState } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ content: '', success: false, error: 'Message is required' }, { status: 400 });
    }

    const state = systemState || {
      setupComplete: false,
      evolutionCycle: 0,
      repoConfig: { owner: 'unknown', repo: 'unknown', branch: 'unknown' },
      connectionStatus: { github: 'idle' },
      saturation: { structuralChange: 0, semanticSaturation: 0, velocity: 0, identityPreservation: 1, capabilityAlignment: 0, crossFileImpact: 0 },
    };

    const contextInfo = `
State: ${state.setupComplete ? 'OPERATIONAL' : 'SETUP'} | Cycle: ${state.evolutionCycle} | Repo: ${state.repoConfig.owner}/${state.repoConfig.repo} | Branch: ${state.repoConfig.branch}`.trim();

    const enhancedSystemPrompt = `${DALEK_CAAN_SYSTEM_PROMPT}\n\n${contextInfo}`;

    const userGeminiKey = (body as unknown as Record<string, unknown>).apiKeys
      ? ((body as unknown as Record<string, Record<string, string>>).apiKeys?.gemini)
      : undefined;
    const geminiKey = userGeminiKey || getDefaultGeminiKey();

    // Unified LLM call: Gemini → SDK → Dalek Brain (local)
    const result = await callLlm({
      systemPrompt: enhancedSystemPrompt,
      userPrompt: message,
      geminiApiKey: geminiKey,
      maxTokens: 1024,
      temperature: 0.7,
    });

    // Final fallback: Dalek Brain chat (shouldn't reach here, but safety net)
    const content = result.text || dalekBrainChat(enhancedSystemPrompt, message, history || []) || 'Processing error. Try again.';

    return NextResponse.json({
      content,
      success: true,
      provider: result.provider || 'Dalek Brain',
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { content: '', success: false, error: errorMessage },
      { status: 500 }
    );
  }
}






