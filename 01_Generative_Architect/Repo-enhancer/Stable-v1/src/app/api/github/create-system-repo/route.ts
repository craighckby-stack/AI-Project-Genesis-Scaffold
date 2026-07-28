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

    try {
      generatedText = await callGemini(systemPrompt, userPrompt, geminiKey, {
        maxTokens: 8192,
        temperature: 0.2, // low temperature for precise JSON generation
        responseMimeType: 'application/json',
        responseSchema,
      });
    } catch (geminiError: any) {
      console.warn('[Create repo] Gemini call failed, attempting fallback to Z-AI SDK:', geminiError.message || geminiError);
      try {
        const zai = await ZAI.create();
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 8192,
          thinking: { type: 'disabled' },
        });
        generatedText = completion.choices?.[0]?.message?.content || null;
        fallbackUsed = true;
      } catch (sdkError: any) {
        console.error('[Create repo] Fallback SDK failed:', sdkError.message || sdkError);
        console.log('[Create repo] Both LLM backends failed. Activating deterministic local AGI compiler.');
        useDeterministicFallback = true;
      }
    }

    const safeParseJson = (str: string): any => {
      let repaired = '';
      let inString = false;
      let escape = false;
      const stack: ('{' | '[')[] = [];

      for (let i = 0; i < str.length; i++) {
        const char = str[i];

        if (escape) {
          repaired += char;
          escape = false;
          continue;
        }

        if (char === '\\') {
          repaired += char;
          if (inString) {
            escape = true;
          }
          continue;
        }

        if (char === '"') {
          inString = !inString;
          repaired += char;
          continue;
        }

        if (inString) {
          if (char === '\n') {
            repaired += '\\n';
          } else if (char === '\r') {
            repaired += '\\r';
          } else {
            repaired += char;
          }
        } else {
          repaired += char;
          if (char === '{' || char === '[') {
            stack.push(char);
          } else if (char === '}') {
            if (stack[stack.length - 1] === '{') {
              stack.pop();
            }
          } else if (char === ']') {
            if (stack[stack.length - 1] === '[') {
              stack.pop();
            }
          }
        }
      }

      if (inString) {
        repaired += '"';
      }

      repaired = repaired.trimEnd();

      if (repaired.endsWith(',')) {
        repaired = repaired.slice(0, -1).trimEnd();
      } else if (repaired.endsWith(':')) {
        repaired += ' ""';
      }

      while (stack.length > 0) {
        const last = stack.pop();
        if (last === '{') {
          repaired += '}';
        } else if (last === '[') {
          repaired += ']';
        }
      }

      return JSON.parse(repaired);
    };

    let compilation: { files: Array<{ path: string; content: string }> };
    if (useDeterministicFallback) {
      console.log('[Create repo] Compiling offline Next.js custom scaffold template.');
      compilation = generateDeterministicFallbackStructure(repoName, description, blueprintName, blueprintContent);
    } else {
      if (!generatedText) {
        throw new Error('Gemini API returned empty compilation output.');
      }
      generatedText = generatedText.trim();
      try {
        compilation = safeParseJson(generatedText);
      } catch (parseErr: any) {
        console.error('Failed to parse compiled JSON. Raw text was:', generatedText);
        // Attempt a fallback extraction
        const jsonMatch = generatedText.match(/{[\s\S]*}/);
        if (jsonMatch) {
          try {
            compilation = safeParseJson(jsonMatch[0]);
          } catch (matchErr: any) {
            throw new Error(`Gemini output could not be parsed as safety JSON schema. Spec compilation broke with error: ${matchErr?.message || matchErr}`);
          }
        } else {
          throw new Error(`Gemini output could not be parsed as standard files schema. Parsing error: ${parseErr?.message || parseErr}`);
        }
      }
    }

    if (!compilation.files || !Array.isArray(compilation.files)) {
      throw new Error('Invalid compilation output format: files array is missing.');
    }

    // Step 3: Create GitHub Repository
    // Check if it already exists
    const existingCheck = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    let repoCreated = existingCheck.ok;
    let defaultBranch = 'main';

    if (!repoCreated) {
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: repoName,
          description: description || `Compiled with Dalek Caan AGI Evolution Engine based on "${blueprintName}" blueprint`,
          auto_init: true,
          private: false,
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(`Failed to create repository on GitHub: ${errData.message || createRes.statusText}`);
      }
      repoCreated = true;
    } else {
      const repoData = await existingCheck.json();
      defaultBranch = repoData.default_branch || 'main';
    }

    // Give GitHub half a second to initialize the branch tree
    await new Promise(r => setTimeout(r, 1000));

    // Get branch reference (or tree SHA) to create commit tree, or just push single files
    // Step 4: Serialized push to GitHub
    const pushedFiles: string[] = [];
    const failedFiles: Array<{ file: string; error: string }> = [];

    for (const file of compilation.files) {
      try {
        const base64Content = Buffer.from(file.content, 'utf-8').toString('base64');
        const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
        
        // Check if file exists to fetch its SHA
        const fileCheckUrl = `https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/contents/${encodedPath}?ref=${defaultBranch}`;
        const checkRes = await fetch(fileCheckUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        let fileSha: string | undefined;
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          fileSha = checkData.sha;
        }

        const putBody: Record<string, unknown> = {
          message: `[DALEK CAAN COMPILER] Spawn spec file: ${file.path}`,
          content: base64Content,
          branch: defaultBranch,
        };

        if (fileSha) {
          putBody.sha = fileSha;
        }

        const putRes = await fetch(`https://api.github.com/repos/${owner}/${encodeURIComponent(repoName)}/contents/${encodedPath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(putBody),
        });

        if (putRes.ok) {
          pushedFiles.push(file.path);
        } else {
          const errText = await putRes.text();
          failedFiles.push({ file: file.path, error: errText });
        }
      } catch (err) {
        failedFiles.push({ file: file.path, error: err instanceof Error ? err.message : 'Unknown write error' });
      }
      // Brief rate-limit safety pause
      await new Promise(r => setTimeout(r, 200));
    }

    return NextResponse.json({
      success: true,
      repoName,
      repoUrl: `https://github.com/${owner}/${repoName}`,
      fullName: `${owner}/${repoName}`,
      pushedFiles,
      failedFiles,
      totalFiles: compilation.files.length,
      fallbackUsed: useDeterministicFallback,
    });

  } catch (error) {
    console.error('Create system repo error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown local compilation error'
    }, { status: 500 });
  }
}

function generateDeterministicFallbackStructure(
  repoName: string,
  description: string,
  blueprintName: string,
  blueprintContent: string
) {
  const escapedRepoName = repoName.replace(/"/g, '\\"');
  const escapedDescription = (description || '').replace(/"/g, '\\"');
  const escapedBlueprintName = (blueprintName || '').replace(/"/g, '\\"');
  const escapedBlueprintContent = (blueprintContent || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');

  const packageJson = `{
  "name": "${repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "framer-motion": "^11.11.11",
    "lucide-react": "^0.468.0",
    "recharts": "^2.15.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "4.0.0-alpha.31"
  }
}`;

  const readmeMd = `# ${repoName}

\${description || "System compiled and optimized under Dalek Caan control."}

## Specifications
- **Blueprint file**: \${blueprintName}
- **Framework**: Next.js 15 with Tailwind CSS
- **Interactions**: Autonomous Evolution Interface enabled

## Quick Start
\\\`\\\`\\\`bash
npm install
npm run dev
\\\`\\\`\\\``;

  const globalsCss = `@import "tailwindcss";
@import "tw-animate-css";`;

  const layoutTsx = `'use client';

import React from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}`;

  let pageTsxTemplate = `'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Shield, Cpu, Activity, Zap, Play, FileText, CheckCircle, RefreshCw, 
  ChevronRight, Database, AlertCircle, Heart, Plus, Trash2, Send
} from 'lucide-react';

interface MetricPoint {
  time: string;
  load: number;
  integrity: number;
  ops: number;
}

interface LogEntry {
  id: string;
  time: string;
  source: 'SYSTEM' | 'CORE' | 'COGNITIVE' | 'AGENT';
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface DataItem {
  id: string;
  name: string;
  category: string;
  status: 'ACTIVE' | 'IDLE' | 'STAGING';
  timestamp: string;
}

export default function UnifiedOperatorWorkspace() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'blueprint' | 'data'>('dashboard');
  const [coreOnline, setCoreOnline] = useState(true);
  const [cpuLoad, setCpuLoad] = useState(42);
  const [quantumStability, setQuantumStability] = useState(94.2);
  const [opsRate, setOpsRate] = useState(122);
  const [metricHistory, setMetricHistory] = useState<MetricPoint[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dataItems, setDataItems] = useState<DataItem[]>([]);
  
  // Data item form
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Core Routing');
  const [newItemStatus, setNewItemStatus] = useState<'ACTIVE' | 'IDLE' | 'STAGING'>('ACTIVE');

  // Simulation speed & cycle
  const [evolutionCycle, setEvolutionCycle] = useState(0);
  const [simLevel, setSimLevel] = useState(50);

  // Initialize data
  useEffect(() => {
    // Generate initial items
    setDataItems([
      { id: 'REC-101', name: 'Standard Cognitive Node', category: 'Cortex Matrix', status: 'ACTIVE', timestamp: '11:42:01' },
      { id: 'REC-102', name: 'Topological Narrative Ring', category: 'Quantum Field', status: 'IDLE', timestamp: '11:42:15' },
      { id: 'REC-103', name: 'Polymorphic Code Injector', category: 'Evolution Core', status: 'STAGING', timestamp: '11:43:02' },
    ]);

    // Initial logs
    setLogs([
      { id: 'L1', time: '11:40:02', source: 'SYSTEM', message: 'Hyper-Heuristic Compiler Initialized.', type: 'info' },
      { id: 'L2', time: '11:41:20', source: 'CORE', message: 'Narrative alignment measured: __BLUEPRINT_NAME__', type: 'success' },
      { id: 'L3', time: '11:42:05', source: 'COGNITIVE', message: 'Dalek Caan autonomous runtime boot sequence complete.', type: 'info' }
    ]);

    // Generate metric history
    const history: MetricPoint[] = [];
    for (let i = 20; i >= 0; i--) {
      const t = new Date(Date.now() - i * 5000);
      const timeStr = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      history.push({
        time: timeStr,
        load: Math.floor(35 + Math.random() * 15),
        integrity: Math.floor(92 + Math.random() * 6),
        ops: Math.floor(100 + Math.random() * 30),
      });
    }
    setMetricHistory(history);
  }, []);

  // Live updates simulator
  useEffect(() => {
    if (!coreOnline) return;

    const interval = setInterval(() => {
      // Calculate dynamic values based on simLevel slider
      const loadFlux = Math.floor((simLevel * 0.7) + (Math.random() * 10 - 5));
      const stableFlux = parseFloat((100 - (simLevel * 0.15) + (Math.random() * 2 - 1)).toFixed(1));
      const opFlux = Math.floor((simLevel * 2) + Math.random() * 15);

      setCpuLoad(Math.max(5, Math.min(100, loadFlux)));
      setQuantumStability(Math.max(10, Math.min(100, stableFlux)));
      setOpsRate(Math.max(0, opFlux));

      // Append metric
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setMetricHistory(prev => {
        const sliced = prev.length > 20 ? prev.slice(1) : prev;
        return [...sliced, {
          time: timeStr,
          load: loadFlux,
          integrity: stableFlux,
          ops: opFlux
        }];
      });

      // Occasional log
      if (Math.random() < 0.25) {
        const types: Array<'info' | 'success' | 'warn' | 'error'> = ['info', 'success', 'warn'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const sources: Array<'SYSTEM' | 'CORE' | 'COGNITIVE' | 'AGENT'> = ['SYSTEM', 'CORE', 'COGNITIVE', 'AGENT'];
        const chosenSource = sources[Math.floor(Math.random() * sources.length)];
        
        const msgs = [
          'Compiling next logic mutation branch...',
          'Coherence verification result: stable.',
          'Sub-agent network telemetry validated.',
          'Telemetry flux stabilized.',
          'Evolution index incremented.'
        ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];

        setLogs(prev => {
          const l = [...prev, {
            id: 'L-' + Math.random(),
            time: timeStr,
            source: chosenSource,
            message: msg,
            type: chosenType
          }];
          return l.length > 50 ? l.slice(1) : l;
        });
      }

    }, 3000);

    return () => clearInterval(interval);
  }, [coreOnline, simLevel]);

  // Form submit handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newItem: DataItem = {
      id: 'REC-' + Math.floor(100 + Math.random() * 900),
      name: newItemName,
      category: newItemCategory,
      status: newItemStatus,
      timestamp: timeStr,
    };

    setDataItems(prev => [newItem, ...prev]);
    setLogs(prev => [
      ...prev,
      {
        id: 'L-' + Math.random(),
        time: timeStr,
        source: 'SYSTEM',
        message: 'Manually staged item: ' + newItemName,
        type: 'success'
      }
    ]);

    setNewItemName('');
  };

  const removeItem = (id: string, name: string) => {
    setDataItems(prev => prev.filter(item => item.id !== id));
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      {
        id: 'L-' + Math.random(),
        time: timeStr,
        source: 'SYSTEM',
        message: 'Removed item: ' + name,
        type: 'warn'
      }
    ]);
  };

  const triggerEvolutionCycle = () => {
    setEvolutionCycle(prev => prev + 1);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [
      ...prev,
      {
        id: 'L-' + Math.random(),
        time: timeStr,
        source: 'CORE',
        message: 'EXTERMINATING legacy layers. Evolution Cycle ' + (evolutionCycle + 1) + ' active!',
        type: 'success'
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-4 w-4 rounded-full bg-cyan-500 animate-pulse" />
            <div className="absolute inset-0 h-4 w-4 rounded-full bg-cyan-400 blur-sm" />
          </div>
          <div>
            <span className="text-xs font-mono text-cyan-500 font-bold tracking-wider uppercase font-sans">DALEK CAAN COMPILER // SIMULATOR LAYER</span>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Cpu className="text-cyan-400 h-5 w-5" />
              __REPO_NAME__
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Core Status:</span>
            <button 
              onClick={() => {
                setCoreOnline(!coreOnline);
                const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                setLogs(prev => [...prev, {
                  id: 'L-' + Math.random(),
                  time: timeStr,
                  source: 'SYSTEM',
                  message: coreOnline ? 'Core runtime paused by Operator.' : 'Core runtime resumed.',
                  type: coreOnline ? 'warn' : 'info'
                }]);
              }}
              className={'text-xs font-mono px-2 py-0.5 rounded transition font-bold tracking-wider uppercase ' + (coreOnline ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40' : 'bg-slate-800 text-slate-500')}
            >
              {coreOnline ? '■ ONLINE' : '○ PAUSED'}
            </button>
          </div>

          <button 
            onClick={triggerEvolutionCycle}
            className="bg-red-950 border border-red-800 hover:border-red-600 px-4 py-1.5 rounded-lg text-red-100 hover:bg-red-900 transition text-xs font-bold font-mono tracking-wider flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3 animate-spin" />
            EVOLVE CORE ({evolutionCycle})
          </button>
        </div>
      </header>

      {/* Hero Intro */}
      <section className="bg-slate-900/30 p-6 border-b border-slate-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-slate-200">System Blueprint Operational Simulation</h2>
          <p className="text-sm text-slate-400 mt-1">
            __DESCRIPTION__
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 text-center min-w-[100px]">
            <span className="block text-9xs font-mono text-slate-500 uppercase">SYS CPU</span>
            <span className="text-lg font-bold font-mono text-cyan-400">{cpuLoad}%</span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 text-center min-w-[100px]">
            <span className="block text-9xs font-mono text-slate-500 uppercase">STABILITY</span>
            <span className="text-lg font-bold font-mono text-yellow-500">{quantumStability}%</span>
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/50 text-center min-w-[100px]">
            <span className="block text-9xs font-mono text-slate-500 uppercase">THROUGHPUT</span>
            <span className="text-lg font-bold font-mono text-green-500">{opsRate} ops</span>
          </div>
        </div>
      </section>

      {/* Main Grid Content */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Column: Navigation & Tab contents */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          {/* Tab Selector */}
          <div className="flex border-b border-slate-800">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={'px-5 py-3 text-xs font-mono tracking-wider font-bold uppercase transition flex items-center gap-2 border-b-2 ' + (activeTab === 'dashboard' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200')}
            >
              <Activity className="h-4 w-4" /> Live Operational Workspace
            </button>
            <button 
              onClick={() => setActiveTab('blueprint')}
              className={'px-5 py-3 text-xs font-mono tracking-wider font-bold uppercase transition flex items-center gap-2 border-b-2 ' + (activeTab === 'blueprint' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200')}
            >
              <FileText className="h-4 w-4" /> Specification Blueprint
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={'px-5 py-3 text-xs font-mono tracking-wider font-bold uppercase transition flex items-center gap-2 border-b-2 ' + (activeTab === 'data' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200')}
            >
              <Database className="h-4 w-4" /> Staged Record Registry ({dataItems.length})
            </button>
          </div>

          {/* Tab Body */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div 
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Performance metrics charts rendering (Custom SVG Line/Area Graphs) */}
                  <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/60">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                      <Cpu className="text-cyan-500 h-4 w-4" />
                      Dynamic Telemetry Stream
                    </h3>
                    
                    {/* SVG Chart */}
                    <div className="h-44 w-full relative bg-slate-950/80 rounded-lg overflow-hidden border border-slate-900 px-1 py-2">
                      <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                        {/* Grids */}
                        <line x1="0" y1="25" x2="500" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                        <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                        <line x1="0" y1="75" x2="500" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
                        
                        {/* Area Gradient */}
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4"/>
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/>
                          </linearGradient>
                        </defs>

                        {/* Chart path generator */}
                        {metricHistory.length > 1 && (
                          <>
                            <path
                              d={metricHistory.reduce((acc, curr, idx) => {
                                const x = (idx / (metricHistory.length - 1)) * 500;
                                const y = 100 - curr.load; // Map 0-100 load to SVG y
                                return acc + (idx === 0 ? "M" : "L") + " " + x + " " + y;
                              }, "") + " L 500 100 L 0 100 Z"}
                              fill="url(#chartGrad)"
                            />
                            <path
                              d={metricHistory.reduce((acc, curr, idx) => {
                                const x = (idx / (metricHistory.length - 1)) * 500;
                                const y = 100 - curr.load; 
                                return acc + (idx === 0 ? "M" : "L") + " " + x + " " + y;
                              }, "")}
                              fill="none"
                              stroke="#06b6d4"
                              strokeWidth="2"
                            />
                          </>
                        )}
                      </svg>
                      <div className="absolute left-2 top-1 text-9xs font-mono text-slate-500">100% Core Load</div>
                      <div className="absolute left-2 bottom-1 text-9xs font-mono text-slate-500">0% Core Load</div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="h-2 w-2 rounded-full bg-cyan-500" />
                          CPU Load History
                        </span>
                      </div>
                      <div className="text-xxs font-mono text-slate-500">
                        Total simulation resolution: 5000ms steps
                      </div>
                    </div>
                  </div>

                  {/* Simulator Controls */}
                  <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/60">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                      <Zap className="text-yellow-500 h-4 w-4" />
                      Dynamic Telemetry Injector Controls
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1 text-xs">
                          <span className="text-slate-400">Target Simulation Drive Level:</span>
                          <span className="font-mono text-cyan-400 font-bold">{simLevel} / 100</span>
                        </div>
                        <input 
                          type="range"
                          min="1"
                          max="100"
                          value={simLevel}
                          onChange={(e) => setSimLevel(parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <p className="text-xs text-slate-400">
                          Adjusting the simulation drive level dynamically alters system CPU loads, increases operational throughput computations, and generates real-time telemetry metrics.
                        </p>
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 flex justify-between items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-cyan-500" />
                            <span className="text-xs text-slate-300">Safe Sandbox Active</span>
                          </div>
                          <span className="text-xxs font-mono bg-green-950 text-green-400 border border-green-800/40 px-2 py-0.5 rounded">SECURE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'blueprint' && (
                <motion.div 
                  key="blueprint"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/60"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                      <FileText className="text-cyan-500 h-4 w-4" />
                      Current Specification: __BLUEPRINT_NAME__
                    </h3>
                    <span className="text-xxs font-mono text-slate-500 bg-slate-900 p-1 rounded">2.1.DOCX Source</span>
                  </div>

                  {/* Blueprint content text */}
                  <div className="bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-900 font-mono text-xs overflow-y-auto max-h-[24rem] leading-relaxed whitespace-pre-wrap">
                    __BLUEPRINT_CONTENT__
                  </div>
                </motion.div>
              )}

              {activeTab === 'data' && (
                <motion.div 
                  key="data"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Registry creation Form */}
                  <div className="bg-slate-900/30 p-5 rounded-2xl border border-slate-800/60">
                    <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                      <Plus className="text-cyan-500 h-4 w-4" />
                      Stage New Record Entity
                    </h3>

                    <form onSubmit={handleAddItem} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-9xs font-mono text-slate-500 uppercase mb-1 font-sans">Entity Name</label>
                          <input 
                            type="text" 
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="e.g. Navigation Bridge Unit"
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 px-3 py-1.5 text-xs rounded-lg text-slate-100 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-9xs font-mono text-slate-500 uppercase mb-1 font-sans">Functional Category</label>
                          <select 
                            value={newItemCategory}
                            onChange={(e) => setNewItemCategory(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 px-3 py-1.5 text-xs rounded-lg text-slate-100 outline-none"
                          >
                            <option value="Cortex Matrix">Cortex Matrix</option>
                            <option value="Quantum Field">Quantum Field</option>
                            <option value="Evolution Core">Evolution Core</option>
                            <option value="Operator Terminal">Operator Terminal</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-9xs font-mono text-slate-500 uppercase mb-1 font-sans">Current State</label>
                          <select 
                            value={newItemStatus}
                            onChange={(e) => setNewItemStatus(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 px-3 py-1.5 text-xs rounded-lg text-slate-100 outline-none"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="IDLE">IDLE</option>
                            <option value="STAGING">STAGING</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button 
                          type="submit" 
                          className="bg-cyan-950 border border-cyan-800/60 hover:border-cyan-500 hover:bg-cyan-900 px-4 py-2 rounded-lg text-xs font-bold text-cyan-200 transition flex items-center gap-2"
                        >
                          <Send className="h-3.5 w-3.5" />
                          STAGE RECORD
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Data Registry Table */}
                  <div className="bg-slate-900/30 rounded-2xl border border-slate-800/60 overflow-hidden">
                    <div className="p-4 bg-slate-900/40 border-b border-slate-800">
                      <h3 className="text-xs font-mono font-bold text-slate-300 font-sans">STAGED RECORD REGISTRY TABLES</h3>
                    </div>
                    {dataItems.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">No records staged in memory. Add some above.</div>
                    ) : (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-slate-900 bg-slate-950/40 text-left text-slate-400 font-mono uppercase text-9xs">
                              <th className="p-3">ID</th>
                              <th className="p-3">Entity Name</th>
                              <th className="p-3">Category</th>
                              <th className="p-3">State</th>
                              <th className="p-3">Staged Time</th>
                              <th className="p-3 text-right font-sans">Delete</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dataItems.map(item => (
                              <tr key={item.id} className="border-b border-slate-900/60 hover:bg-slate-900/20 text-slate-300 transition">
                                <td className="p-3 font-mono text-xxs text-cyan-500 font-bold">{item.id}</td>
                                <td className="p-3 font-medium text-slate-100">{item.name}</td>
                                <td className="p-3 font-mono text-slate-400">{item.category}</td>
                                <td className="p-3">
                                  <span className={'px-2 py-0.5 rounded text-9xs font-mono font-bold tracking-wider ' + (item.status === 'ACTIVE' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40' : item.status === 'IDLE' ? 'bg-slate-900 text-slate-400' : 'bg-yellow-950 text-yellow-400 border border-yellow-800/40')}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-500 text-xxs">{item.timestamp}</td>
                                <td className="p-3 text-right">
                                  <button 
                                    onClick={() => removeItem(item.id, item.name)}
                                    className="text-slate-500 hover:text-red-400 hover:bg-slate-900/40 p-1.5 rounded transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Right Column: Logging feed */}
        <section className="lg:col-span-4 bg-slate-900/20 rounded-2xl border border-slate-800/60 flex flex-col h-[34rem] overflow-hidden">
          <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2 font-sans">
              <Terminal className="h-4 w-4 text-cyan-500" />
              SYSTEM TELEMETRY FEED
            </h3>
            <button 
              onClick={() => setLogs([])}
              className="text-9xs font-mono text-slate-500 hover:text-cyan-400 transition"
            >
              CLEAR FEED
            </button>
          </div>

          {/* Logs Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xxs leading-relaxed bg-slate-950/50">
            {logs.length === 0 ? (
              <div className="text-center py-10 text-slate-600">Unified console stream empty. Waiting for operations...</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-slate-600 font-bold shrink-0">[{log.time}]</span>
                  <span className={'px-1 rounded font-bold uppercase shrink-0 text-10xs ' + 
                    (log.source === 'SYSTEM' ? 'text-cyan-400 bg-cyan-950' : 
                     log.source === 'CORE' ? 'text-red-400 bg-red-950' : 
                     log.source === 'COGNITIVE' ? 'text-yellow-400 bg-yellow-950' : 'text-purple-400 bg-purple-950')
                  }>
                    {log.source}
                  </span>
                  <span className={
                    log.type === 'success' ? 'text-green-400' : 
                    log.type === 'warn' ? 'text-yellow-400' : 
                    log.type === 'error' ? 'text-red-400' : 'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950 px-6 py-4 mt-auto text-center">
        <p className="text-9xs font-mono text-slate-500 flex items-center justify-center gap-1.5 font-sans">
          <span>DALEK CAAN SYSTEMS CORE</span>
          <span>•</span>
          <span>AUTONOMOUS CODE EVOLUTION SATELLITE ENGINE</span>
          <span>•</span>
          <span>SECURE OPERATOR FRAMEWORK</span>
        </p>
      </footer>
    </div>
  );
}`;

  const pageTsx = pageTsxTemplate
    .split('__REPO_NAME__').join(escapedRepoName)
    .split('__DESCRIPTION__').join(escapedDescription)
    .split('__BLUEPRINT_NAME__').join(escapedBlueprintName)
    .split('__BLUEPRINT_CONTENT__').join(escapedBlueprintContent);

  return {
    files: [
      { path: 'package.json', content: packageJson },
      { path: 'README.md', content: readmeMd },
      { path: 'src/app/globals.css', content: globalsCss },
      { path: 'src/app/layout.tsx', content: layoutTsx },
      { path: 'src/app/page.tsx', content: pageTsx },
    ]
  };
}
