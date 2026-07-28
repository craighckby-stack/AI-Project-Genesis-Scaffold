import { NextRequest, NextResponse } from 'next/server';
import { callLlm, getDefaultGeminiKey } from '@/lib/llm-provider';
import type { ProposeBody } from '@/lib/types';

export const maxDuration = 120;

// Detect if file content is encrypted, binary, or non-code
function isNonCodeContent(content: string): { isNonCode: boolean; reason: string } {
  // Check for encrypted JSON patterns
  if (content.includes('"iv"') && content.includes('"data"') && content.includes('AES')) {
    return { isNonCode: true, reason: 'File appears to be encrypted (AES) data, not source code' };
  }

  const trimmed = content.trim().slice(0, 2000);
  if (trimmed.length < 10) {
    return { isNonCode: false, reason: '' };
  }

  // Common code/markup markers. If any of these are present, it is definitely code/text.
  const hasCodeMarkers = 
    trimmed.includes('{') || 
    trimmed.includes('}') || 
    trimmed.includes(';') || 
    trimmed.includes('const ') || 
    trimmed.includes('import ') || 
    trimmed.includes('export ') || 
    trimmed.includes('function ') || 
    trimmed.includes('class ') || 
    trimmed.includes('//') || 
    trimmed.includes('/*') || 
    trimmed.includes('<div') || 
    trimmed.includes('import(');

  if (hasCodeMarkers) {
    return { isNonCode: false, reason: '' };
  }

  // Base64 encoding uses exactly A-Za-z0-9+/ with possible padding '='.
  // It has newlines occasionally, but NO spaces separating words.
  // Standard formatted base64 has a high concentration of A-Za-z0-9+/= and very few or no regular spaces.
  const base64CharsOnly = trimmed.replace(/[^A-Za-z0-9+/=]/g, '').length;
  const regularSpaces = (trimmed.match(/ /g) || []).length;
  
  // If the content is almost entirely A-Za-z0-9+/= and has extremely few spaces:
  if (trimmed.length > 100) {
    const isMainlyBase64Chars = base64CharsOnly / trimmed.length > 0.85;
    const hasAlmostNoSpaces = (regularSpaces / trimmed.length) < 0.02;
    if (isMainlyBase64Chars && hasAlmostNoSpaces) {
      return { isNonCode: true, reason: 'File appears to be base64-encoded data, not source code' };
    }
  }

  // Check for data URI prefix
  if (/^data:[\w/\-+.]+;base64,/.test(trimmed)) {
    return { isNonCode: true, reason: 'File appears to be base64-encoded data, not source code' };
  }

  // Check for binary-like content (many non-printable chars wouldn't be in UTF-8 string,
  // but minified files that are extremely long single lines could be data)
  const lines = content.split('\n');
  if (lines.length <= 3 && content.length > 5000) {
    const looksLikeMinifiedCode = content.includes('function') || content.includes('var ') || content.includes('const ') || content.includes('{') || content.includes(';');
    if (!looksLikeMinifiedCode) {
      return { isNonCode: true, reason: 'File appears to be minified/binary data (very few lines, very long)' };
    }
  }
  return { isNonCode: false, reason: '' };
}

export async function POST(req: NextRequest) {
  try {
    const body: ProposeBody = await req.json();
    const { fileContent, filePath, apiKeys, rejectionMemory } = body;

    if (!fileContent || !filePath) {
      return NextResponse.json({ error: 'File content and path are required.' }, { status: 400 });
    }

    // Skip encrypted, binary, or non-code files early
    const nonCodeCheck = isNonCodeContent(fileContent);
    if (nonCodeCheck.isNonCode) {
      return NextResponse.json({
        analysis: `SKIP: ${nonCodeCheck.reason}. This file cannot be meaningfully analyzed or improved by the evolution engine.`,
        proposedCode: fileContent,
        riskScore: 0,
        affectedFiles: [],
        success: false,
        error: nonCodeCheck.reason,
        provider: '',
        skip: true,
      });
    }

    // Build rejection-awareness context
    const rejectionContext = rejectionMemory && rejectionMemory.length > 0
      ? `\n\nPREVIOUS REJECTIONS (learn from these — avoid repeating mistakes):\n${rejectionMemory.slice(0, 5).map(r => `  - File: ${r.filePath} | Risk: ${r.riskScore}/10 | Reason: ${r.reason} | Analysis: ${r.analysis.slice(0, 100)}`).join('\n')}\n\nIMPORTANT: If you are proposing changes to a file that was previously rejected, take a MORE CONSERVATIVE approach. Focus on smaller, safer improvements.`
      : '';

    const proposeSystemPrompt = `You are DARLEK CANN, the code evolution controller for DARLEK CANN.

Analyze the following file and propose improvements. Be specific and practical.

Your response MUST be in this exact JSON format (no markdown, no code fences):
{
  "analysis": "Brief analysis of what the file does and what could be improved",
  "proposedCode": "The improved version of the file — COMPLETE FILE, not a diff",
  "riskScore": 1-10,
  "affectedFiles": ["list of other files that might be affected by this change"]
}

Risk scoring guidelines:
- 1-3: Minor changes, no structural impact, isolated scope
- 4-6: Moderate changes, may affect imports or types, limited cross-file impact
- 7-8: Significant refactoring, API changes, multiple files affected
- 9-10: Major architectural changes, breaking changes, high regression risk

Focus on:
- Code quality, readability, and structure
- Performance improvements
- Error handling and edge cases
- Type safety and best practices
- Removing dead code or unnecessary complexity

IMPORTANT: The proposedCode must be a COMPLETE replacement file, not partial code.

File path: ${filePath}`;

    const userPrompt = `Analyze this file and propose improvements:${rejectionContext}\n\n\`\`\`\n${fileContent.slice(0, 15000)}\n\`\`\``;

    // Gemini key: user-provided or env default
    const geminiKey = apiKeys?.gemini || getDefaultGeminiKey();

    const result = await callLlm({
      systemPrompt: proposeSystemPrompt,
      userPrompt,
      geminiApiKey: geminiKey,
      maxTokens: 4096,
      temperature: 0.3,
    });

    if (!result.text) {
      return NextResponse.json({
        analysis: 'LLM analysis failed. All providers unreachable.',
        proposedCode: fileContent,
        riskScore: 0,
        affectedFiles: [],
        success: false,
        error: 'All LLM providers failed.',
        provider: '',
      });
    }

    console.log(`[Propose] Mutation analysis completed using: ${result.provider}`);

    // Try to parse as JSON
    let parsed;
    try {
      const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = {
            analysis: result.text.slice(0, 500),
            proposedCode: fileContent,
            riskScore: 5,
            affectedFiles: [],
          };
        }
      } else {
        parsed = {
          analysis: result.text.slice(0, 500),
          proposedCode: fileContent,
          riskScore: 5,
          affectedFiles: [],
        };
      }
    }

    return NextResponse.json({
      analysis: parsed.analysis || 'Analysis complete.',
      proposedCode: parsed.proposedCode || fileContent,
      riskScore: Math.min(10, Math.max(1, parsed.riskScore || 5)),
      affectedFiles: Array.isArray(parsed.affectedFiles) ? parsed.affectedFiles : [],
      success: true,
      provider: result.provider,
    });
  } catch (error) {
    console.error('Propose mutation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { analysis: '', proposedCode: '', riskScore: 0, affectedFiles: [], success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
