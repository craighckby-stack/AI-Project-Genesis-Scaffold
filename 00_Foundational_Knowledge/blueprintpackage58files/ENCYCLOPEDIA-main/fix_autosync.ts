import fs from 'fs';

let fileStr = fs.readFileSync('autoSyncLogic.ts', 'utf-8');

fileStr = fileStr.replace(/state\.processedRepos\.push\(repo\.full_name\);\s*state\.processedFilesInCurrentRepo = \[\];\s*saveSyncState\(state\);\s*\}\s*state\.processedRepos\.push\(repo\.full_name\);\s*state\.processedFilesInCurrentRepo = \[\];\s*saveSyncState\(state\);/m, 
\`state.processedRepos.push(repo.full_name);
        state.processedFilesInCurrentRepo = [];
        saveSyncState(state);\`);

fs.writeFileSync('autoSyncLogic.ts', fileStr, 'utf-8');

