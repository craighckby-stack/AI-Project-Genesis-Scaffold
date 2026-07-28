#!/bin/bash

# Automated Monorepo Assembler
# Generated: 2026-07-11T13:05:32.405Z

WORKSPACE_DIR="consolidated_workspace"

echo "🚀 Initializing Monorepo Workspace in $WORKSPACE_DIR..."
mkdir -p $WORKSPACE_DIR
cd $WORKSPACE_DIR

cat << 'EOF' > pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
EOF

mkdir -p apps packages

echo "📦 [WORKSPACE] Cloning test_snippets into apps/..."
# Cannot clone local repository test_snippets
echo "📦 [WORKSPACE] Cloning Research into apps/..."
# Cannot clone local repository Research
echo "📦 [WORKSPACE] Cloning Quantum-Truth-Analysis-System-main into apps/..."
# Cannot clone local repository Quantum-Truth-Analysis-System-main
echo "📦 [WORKSPACE] Cloning Open-Repo-Generator-V2-main into apps/..."
# Cannot clone local repository Open-Repo-Generator-V2-main
echo "📦 [WORKSPACE] Cloning nexus_repository into apps/..."
# Cannot clone local repository nexus_repository
echo "📦 [WORKSPACE] Cloning Folder 2 into apps/..."
# Cannot clone local repository Folder 2
echo "📦 [WORKSPACE] Cloning Folder 1 into apps/..."
# Cannot clone local repository Folder 1
echo "📦 [WORKSPACE] Cloning extracted_code into apps/..."
# Cannot clone local repository extracted_code
echo "📦 [WORKSPACE] Cloning Deepconvo into apps/..."
# Cannot clone local repository Deepconvo
echo "📦 [WORKSPACE] Cloning Colab Notebooks into apps/..."
# Cannot clone local repository Colab Notebooks
echo "📦 [WORKSPACE] Cloning Chatgtpchat into apps/..."
# Cannot clone local repository Chatgtpchat
echo "📦 [WORKSPACE] Cloning Autonomous-Knowledge-System-main into apps/..."
# Cannot clone local repository Autonomous-Knowledge-System-main
echo "📦 [WORKSPACE] Cloning Autonomous_Knowledge_System_Package into apps/..."
# Cannot clone local repository Autonomous_Knowledge_System_Package
echo "📦 [WORKSPACE] Cloning 1233 into apps/..."
# Cannot clone local repository 1233

echo "🔗 Configuring Workspace Peer Dependencies..."
cat << 'EOF' > link-peers.js
const fs = require('fs');
const path = require('path');

const workspaceDirs = ['apps', 'packages'];
const packagesMap = {};

// 1. Gather all local package names and their paths
workspaceDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const subdirs = fs.readdirSync(dir);
  subdirs.forEach(subdir => {
    const pkgJsonPath = path.join(dir, subdir, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        if (pkg.name) {
          packagesMap[pkg.name] = pkgJsonPath;
        }
      } catch (e) {}
    }
  });
});

// 2. Link internal package dependencies to use "workspace:*"
const localPackageNames = Object.keys(packagesMap);
Object.entries(packagesMap).forEach(([name, pkgJsonPath]) => {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    let modified = false;
    ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
      if (pkg[depType]) {
        Object.keys(pkg[depType]).forEach(depName => {
          if (localPackageNames.includes(depName)) {
            pkg[depType][depName] = "workspace:*";
            modified = true;
          }
        });
      }
    });
    if (modified) {
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
}
  } catch (e) {}
});
EOF

node link-peers.js
rm link-peers.js

echo "✨ Workspace Assembly Complete! You can now run 'pnpm install' from $WORKSPACE_DIR"
