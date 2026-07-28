import fs from 'fs';

let serverStr = fs.readFileSync('server.ts', 'utf-8');

const regex = /export function generateMarkdown[\s\S]*?return md;\n\}/m;

const newGenMd = "export function generateMarkdown(db: EncyclopediaData): string {\n" +
"  let md = `# ${db.meta.title}\\n\\n`;\n" +
"  md += `*Created by: ${db.meta.creator}*\\n\\n`;\n" +
"  md += `**Purpose:** ${db.meta.purpose}\\n\\n`;\n" +
"  md += `*Last Updated: ${new Date(db.meta.updatedAt).toLocaleString()}*\\n\\n`;\n" +
"  md += \"---\\n\\n\";\n" +
"  \n" +
"  md += \"## Table of Contents\\n\\n\";\n" +
"  for (const volume of db.volumes) {\n" +
"    md += `- [${volume.name}](#volume-${volume.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\\n`;\n" +
"    for (const chapter of volume.chapters) {\n" +
"      md += `  - [${chapter.name}](#chapter-${chapter.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\\n`;\n" +
"      for (const capId of chapter.capabilities) {\n" +
"        const cap = db.capabilities[capId];\n" +
"        if (!cap) continue;\n" +
"        md += `    - [${cap.name}](#${cap.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\\n`;\n" +
"      }\n" +
"    }\n" +
"  }\n" +
"  md += \"\\n---\\n\\n\";\n" +
"  \n" +
"  for (const volume of db.volumes) {\n" +
"    md += `## Volume: ${volume.name}\\n\\n`;\n" +
"    for (const chapter of volume.chapters) {\n" +
"      md += `### ${chapter.name}\\n\\n`;\n" +
"      for (const capId of chapter.capabilities) {\n" +
"        const cap = db.capabilities[capId];\n" +
"        if (!cap) continue;\n" +
"        md += `#### ${cap.name}\\n\\n`;\n" +
"        \n" +
"        md += `**1. What is it?**\\n\\n`;\n" +
"        if (cap.summary) md += `${cap.summary}\\n\\n`;\n" +
"        if (cap.howItWorks) md += `${cap.howItWorks}\\n\\n`;\n" +
"        \n" +
"        md += `**2. Why does it exist?**\\n\\n`;\n" +
"        if (cap.purpose) md += `${cap.purpose}\\n\\n`;\n" +
"        if (cap.whyItExists) md += `${cap.whyItExists}\\n\\n`;\n" +
"        if (cap.evolution) md += `*Evolution:* ${cap.evolution}\\n\\n`;\n" +
"        \n" +
"        md += `**3. Where has it been used?**\\n\\n`;\n" +
"        const repos = Array.from(new Set(cap.variants.map(v => v.chunk.repo)));\n" +
"        for (const r of repos) {\n" +
"           md += `- ${r}\\n`;\n" +
"        }\n" +
"        md += `\\n`;\n" +
"        \n" +
"        md += `**4. How is it implemented?**\\n\\n`;\n" +
"        \n" +
"        const canonical = cap.variants.find(v => v.chunk.id === cap.bestImplementationId);\n" +
"        if (canonical) {\n" +
"          md += `*Canonical Implementation (from ${canonical.chunk.repo} - ${canonical.chunk.file}):*\\n\\n`;\n" +
"          md += `> ${canonical.chunk.docstring || canonical.chunk.name}\\n\\n`;\n" +
"          md += `\\`\\`\\`\\n${canonical.chunk.code}\\n\\`\\`\\`\\n\\n`;\n" +
"        }\n" +
"        \n" +
"        if (cap.variants.length > 1 || !canonical) {\n" +
"          md += `**Variants:**\\n\\n`;\n" +
"          for (const variant of cap.variants) {\n" +
"            if (variant.chunk.id === cap.bestImplementationId) continue;\n" +
"            md += `<details>\\n<summary>${variant.chunk.name} (${variant.chunk.repo})</summary>\\n\\n`;\n" +
"            md += `*${variant.chunk.docstring || variant.chunk.name}*\\n\\n`;\n" +
"            md += `\\`\\`\\`\\n${variant.chunk.code}\\n\\`\\`\\`\\n\\n`;\n" +
"            md += `</details>\\n\\n`;\n" +
"          }\n" +
"        }\n" +
"      }\n" +
"    }\n" +
"  }\n" +
"  \n" +
"  return md;\n" +
"}";

serverStr = serverStr.replace(regex, newGenMd);
fs.writeFileSync('server.ts', serverStr, 'utf-8');
console.log("Updated generateMarkdown");