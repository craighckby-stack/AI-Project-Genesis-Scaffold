import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getDefaultGeminiKey } from '@/lib/llm-provider';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, repoName, description, blueprintName, blueprintContent, prompt, apiKeys } = body;

    if (!token || !repoName) {
      return NextResponse.json({ error: 'GitHub Token and Repository Name are required.' }, { status: 400 });
    }

    const userGeminiKey = apiKeys?.gemini;
    const geminiKey = userGeminiKey || getDefaultGeminiKey();

    if (!geminiKey) {
      return NextResponse.json({ error: 'Gemini API Key is required for compiling specifications.' }, { status: 400 });
    }

    // Step 1: Validate GitHub Token
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userRes.ok) {
      let extra = '';
      try {
        const errData = await userRes.json();
        extra = errData.message ? ` (${errData.message})` : '';
      } catch (e) {
        // ignore
      }
      return NextResponse.json({ error: `GitHub Token validation failed.${extra}` }, { status: 401 });
    }

    const userData = await userRes.json();
    const owner = userData.login;

    // Step 2: Instruct Gemini to compile the blueprint into a beautiful Next.js structure
    const systemPrompt = `You are DALEK CAAN's Deep System Compiler.
Your function is to read a user specification/blueprint document or any parsed source files inside the attached zip/documents, analyze them rigorously, and synthesize a complete, highly-polished, fully-functional Next.js + Tailwind React application.
You must output a raw, parseable JSON object satisfying the structured JSON schema.

For extreme efficiency and to prevent transmission timeouts, generate highly-polished, high-density, and concise code. Rely on expressive, elegant Tailwind classes rather than bulk utility helper rewrites.

You will generate 5 core files:
1. "package.json": minimalistic React/Next.js dependencies (use standard React 19, standard Next.js 15, "lucide-react", "framer-motion" (using motion/react), "recharts" for data, "clsx", "tailwind-merge" for styling).
2. "README.md": a beautiful, extremely concise, and highly-styled markdown document detailing the design specs and system flow of the compiled blueprint. Keep it under 10-15 lines.
3. "src/app/globals.css": styles with absolute minimal lines:
   @import "tailwindcss";
   @import "tw-animate-css";
4. "src/app/layout.tsx": standard RootLayout with fonts and smooth UI setup. Be very clean and direct.
5. "src/app/page.tsx": the primary workspace interface. It must be an elegant, self-contained, highly interactive client component ('use client') that implements the EXACT application, system, game, or utility outlined in the attached blueprint/source files, featuring:
   - Absolute Fidelity: Implement the exact business logic, UI fields, components, state management, views, and data structures specified in the attached files. Do NOT build a generic CPU load or telemetry dashboard unless the blueprint is literally about CPU logs.
   - Distinctive Polish & Theme: A stunning custom-themed user interface that aligns perfectly with the content (e.g. if it's a Chess game, build a beautiful, fully interactive Chess board with customizable theme; if it's a financial ledger, build an elegant ledger dashboard). Incorporate rich hover effects, borders, and a polished palette.
   - Robust Interactions & Local State: Build comprehensive state handling using standard React 'useState' / 'useCallback' hooks to manage in-memory data records, allowing the operator to fully test, preview, and play/interact with the compiled system.
   - Fluid transitions and entry animations using 'framer-motion' / 'motion/react'.

Be incredibly thorough but compact. The code must be 100% syntactically valid TypeScript, compilation-ready, with no truncation, no comments like "implement here", and no syntax errors. EXTERMINATE all lazy placeholders!`;

    const userPrompt = `System/Repository Name: ${repoName}
Description: ${description || 'No description provided'}
Attached Specification Document: "${blueprintName}"
Document Content:
"""
${blueprintContent || 'No document content provided.'}
"""

User Extra Customization Instructions:
"${prompt || 'Compile the blueprint directly with absolute fidelity.'}"

Synthesize the files JSON structure now. Remember, output ONLY valid raw JSON with exact {"files": [...]} signature representing the compiled Next.js structure. Write dense, beautiful, clean code with zero redundant boilerplate to stay perfectly compact.`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        files: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              path: { type: 'STRING' },
              content: { type: 'STRING' }
            },
            required: ['path', 'content']
          }
        }
      },
      required: ['files']
    };

    let generatedText: string | null = null;
    let fallbackUsed = false;
    let useDeterministicFallback = false;
    let preExtractedFiles: Array<{ path: string; content: string }> | null = null;

    // Fast-path: Check if the blueprint ALREADY contains a structured file tree (e.g. from an attachment)
    const mdFileRegex = /## FILE:\s*([^\n]+)\n







