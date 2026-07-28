const fs = require('fs');
let code = fs.readFileSync('autoSyncLogic.ts', 'utf-8');
code = code.replace(
  '        const codeFiles = treeData.tree.filter(f =>',
  '        const codeFiles = treeData.tree.filter(f =>'
);
code = code.replace(
  '        const codeFiles = treeData.tree.filter(f => \\n          f.type === "blob" && f.path &&\\n          /\\\\.(ts|js|py|tsx|jsx|go|rs|java|c|cpp|rb)$/.test(f.path)\\n        );',
  '        const codeFiles = treeData.tree.filter(f => \\n          f.type === "blob" && f.path &&\\n          /\\\\.(ts|js|py|tsx|jsx|go|rs|java|c|cpp|rb)$/.test(f.path)\\n        );\\n\\n        state.totalFilesInCurrentRepo = codeFiles.length;\\n        saveSyncState(state);'
);
// I should just re-write the file entirely or use a simpler regex.