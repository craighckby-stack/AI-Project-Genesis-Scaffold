const fs = require('fs');
let code = fs.readFileSync('src/app/api/evolution/propose/route.ts', 'utf8');
code = code.replace(/siphonedCodeContext\}```\$\{fileContent/g, "siphonedCodeContext}\\`\\`\\`${fileContent");
fs.writeFileSync('src/app/api/evolution/propose/route.ts', code);
