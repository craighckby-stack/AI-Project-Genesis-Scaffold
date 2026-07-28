import fs from 'fs';

let fileStr = fs.readFileSync('classifier.ts', 'utf-8');

const scanPromptRegex = /You are building an Encyclopedia of Engineering Knowledge\.[\s\S]*?Return ONLY JSON matching the schema\./m;
const newScanPrompt = `You are building an Encyclopedia of Engineering Knowledge.
We organize code snippets into conceptual "Capabilities" (engineering concepts/problems) across various programming languages and systems.

Current capabilities:
\${JSON.stringify(existingCapabilities, null, 2)}

Analyze the following code snippet from \${repoFullName} - \${file.path}:
\`\`\`
\${code.substring(0, 8000)}
\`\`\`

Task:
1. Does this code implement one of the existing conceptual capabilities? (e.g. if it's Python doing Firebase Auth, it belongs with the JavaScript Firebase Auth capability)
2. If yes, return its existing capabilityId.
3. If no, this is a new capability. Propose a new capabilityId (kebab-case), name, purpose, whyItExists, evolution, dependencies, volume name, and chapter name.
4. Provide a capabilityHowItWorks and capabilitySummary. If this is an existing capability, regenerate them to incorporate this new chunk. If it is new, generate them from scratch based on this chunk.

CRITICAL INSTRUCTIONS:
- Capabilities should be high-level engineering concepts (e.g., "Firebase Initialization", "Repository Scanner", "JWT Validation", "Vector Embedding Generation").
- DO NOT name capabilities after specific filenames or isolated repositories unless absolutely necessary.
- Your goal is to merge Python, JavaScript, TypeScript, Markdown, etc. into the same conceptual article if they solve the same problem.

Return ONLY JSON matching the schema.`;

fileStr = fileStr.replace(scanPromptRegex, newScanPrompt);
fs.writeFileSync('classifier.ts', fileStr, 'utf-8');

