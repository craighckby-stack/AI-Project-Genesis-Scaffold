{
  "name": "emg-core-evolution-nexus",
  "version": "7.0.0",
  "description": "Sovereign AGI Evolution Kernel - Deterministic DNA Packer",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "evolve": "tsx src/tools/dnaPackerTool.ts"
  },
  "dependencies": {
    "@genkit-ai/ai": "^0.5.0",
    "brotli-wasm": "^3.0.0",
    "p-limit": "^5.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.16",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}