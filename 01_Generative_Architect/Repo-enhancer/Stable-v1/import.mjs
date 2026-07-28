import { renameSync, readdirSync, lstatSync, rmSync } from 'fs';
import { join } from 'path';

const srcDir = './repo';
const destDir = '.';

// Clean existing files to avoid conflicts, except /repo
readdirSync(destDir).forEach(file => {
  if (['repo', 'node_modules', '.env', 'import.mjs', 'import-sdk.mjs'].includes(file)) return;
  rmSync(join(destDir, file), { recursive: true, force: true });
});

// Move repo files to root
readdirSync(srcDir).forEach(file => {
  if (file === 'node_modules' || file === '.git') return;
  renameSync(join(srcDir, file), join(destDir, file));
});

console.log('Moved all files from /repo to root');
