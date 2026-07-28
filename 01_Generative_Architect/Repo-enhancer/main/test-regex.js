const blueprintContent = `## FILE: src/App.tsx
\`\`\`typescript
import React from 'react';
\`\`\`

## FILE: package.json
\`\`\`
{ "name": "test" }
\`\`\`
`;

const files = [];
const mdFileRegex = /## FILE:\s*([^\n]+)\n\`\`\`[a-z]*\n([\s\S]*?)\`\`\`/g;
let match;
while ((match = mdFileRegex.exec(blueprintContent)) !== null) {
  files.push({ path: match[1].trim(), content: match[2].trim() });
}







