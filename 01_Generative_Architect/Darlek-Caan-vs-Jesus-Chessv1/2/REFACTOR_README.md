# RefactorEngine Documentation

## Overview
Part of the `sovereign-kernel` suite. This utility performs atomic variable refactoring across the codebase.

## Usage
bash
node renameVars.js [--dry-run]


## Architecture
- **Atomic Writes**: Uses `fs/promises` to ensure file integrity.
- **Regex Safety**: Uses word-boundary anchors (`\b`) to prevent partial string replacement.
- **Integration**: Designed to be injected into the `darlek-cann-v3` CI/CD pipeline.

## Configuration
Modify `CONFIG` in `renameVars.js` to define new mapping sets.




