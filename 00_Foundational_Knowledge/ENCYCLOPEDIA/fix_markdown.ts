import fs from 'fs';

let serverStr = fs.readFileSync('server.ts', 'utf-8');
serverStr = serverStr.replace(/md \+= \`\*\*Summary:\*\* \$\{cap\.summary\}\\n\\n\`;/g, 'if (cap.summary) md += `**Summary:** ${cap.summary}\\n\\n`;');
serverStr = serverStr.replace(/md \+= \`\*\*How it works:\*\* \$\{cap\.howItWorks\}\\n\\n\`;/g, 'if (cap.howItWorks) md += `**How it works:** ${cap.howItWorks}\\n\\n`;');
fs.writeFileSync('server.ts', serverStr);
