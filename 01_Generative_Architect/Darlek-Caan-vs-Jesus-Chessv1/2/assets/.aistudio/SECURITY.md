# OMEGA Security Validator Architecture

## Overview
This module provides real-time entropy-based secret detection. It is designed to be integrated into the CI/CD pipeline of the `darlek-cann-v3` ecosystem.

## Workflow
1. **Recursive Traversal**: Scans project directories up to `maxDepth`.
2. **Stream Processing**: Uses `readline` streams to process files line-by-line, ensuring low memory footprint.
3. **Entropy Analysis**: Calculates Shannon entropy to distinguish between random-looking keys and standard code.

## Configuration
- `entropyThreshold`: 4.8 (Adjust based on false-positive rates).
- `forbiddenExtensions`: Hard-blocked file types.

## Integration
Import `runSecurityAudit` into your main entry point:
typescript
import { runSecurityAudit } from './assets/.aistudio/security-validator';
runSecurityAudit(process.cwd());
