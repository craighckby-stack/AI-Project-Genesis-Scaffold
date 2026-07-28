import fs from 'fs';

let serverStr = fs.readFileSync('server.ts', 'utf-8');

const scanPromptRegex = /You are building an Encyclopedia of Engineering Knowledge\.[\s\S]*?chunkSummary": "Brief summary"\n\}/m;
const newScanPrompt = `You are building an Encyclopedia of Engineering Knowledge.
We organize code snippets into conceptual "Capabilities" (engineering concepts/problems) across various programming languages and systems.

Current capabilities:
\${JSON.stringify(existingCapabilities, null, 2)}

Analyze this code from \${repoFullName} - \${file.path}:
\`\`\`
\${code.substring(0, 8000)} // Truncated for token limits
\`\`\`

Task:
1. Does this code implement one of the existing conceptual capabilities? (e.g. if it's Python doing Firebase Auth, it belongs with the JavaScript Firebase Auth capability)
2. If yes, return its existing capabilityId.
3. If no, propose a new capabilityId (kebab-case), name, purpose, whyItExists, evolution, dependencies, volume name (e.g. "Networking", "Storage", "UI", "AI", "Core"), and chapter name.

CRITICAL INSTRUCTIONS:
- Capabilities should be high-level engineering concepts (e.g., "Firebase Initialization", "Repository Scanner", "JWT Validation", "Vector Embedding Generation").
- DO NOT name capabilities after specific filenames or isolated repositories unless absolutely necessary.
- Your goal is to merge Python, JavaScript, TypeScript, Markdown, etc. into the same conceptual article if they solve the same problem.

Return ONLY JSON:
{
  "isNewCapability": boolean,
  "capabilityId": "existing-id or new-id",
  "newCapabilityDetails": {
    "name": "...",
    "purpose": "...",
    "whyItExists": "...",
    "evolution": "...",
    "dependencies": ["..."],
    "volume": "...",
    "chapter": "..."
  },
  "chunkName": "Short descriptive name (e.g. Python implementation)",
  "chunkSummary": "Brief summary of what this specific chunk does"
}`;

serverStr = serverStr.replace(scanPromptRegex, newScanPrompt);

const analyzePromptRegex = /You are building an Encyclopedia of Engineering Knowledge\.[\s\S]*?chunkSummary": "Brief docstring\/summary of what this specific chunk does\."\n\}\n/m;
const newAnalyzePrompt = `You are building an Encyclopedia of Engineering Knowledge.
We organize code snippets into conceptual "Capabilities" (engineering concepts/problems) across various programming languages and systems.

Current capabilities:
\${JSON.stringify(existingCapabilities, null, 2)}

Analyze the following code snippet from \${repo} - \${filename}:
\`\`\`
\${code}
\`\`\`

Task:
1. Does this code implement one of the existing conceptual capabilities? (e.g. if it's Python doing Firebase Auth, it belongs with the JavaScript Firebase Auth capability)
2. If yes, return its existing capabilityId.
3. If no, this is a new capability. Propose a new capabilityId (kebab-case), name, purpose, whyItExists, evolution (a guess), dependencies, volume name (e.g. "Networking", "Storage", "UI", "AI", "Core"), and chapter name.

CRITICAL INSTRUCTIONS:
- Capabilities should be high-level engineering concepts (e.g., "Firebase Initialization", "Repository Scanner", "JWT Validation", "Vector Embedding Generation").
- DO NOT name capabilities after specific filenames or isolated repositories unless absolutely necessary.
- Your goal is to merge Python, JavaScript, TypeScript, Markdown, etc. into the same conceptual article if they solve the same problem.

Return ONLY JSON:
{
  "isNewCapability": boolean,
  "capabilityId": "existing-id or new-id",
  "newCapabilityDetails": {
    "name": "...",
    "purpose": "...",
    "whyItExists": "...",
    "evolution": "...",
    "dependencies": ["..."],
    "volume": "...",
    "chapter": "..."
  },
  "chunkName": "Short descriptive name (e.g. Python implementation)",
  "chunkSummary": "Brief docstring/summary of what this specific chunk does."
}
`;

serverStr = serverStr.replace(analyzePromptRegex, newAnalyzePrompt);
fs.writeFileSync('server.ts', serverStr, 'utf-8');
console.log("Updated server.ts prompts");