# Repository Auditor

Repository Auditor is an advanced, multi-stage GitHub repository scanner, analyzer, and monorepo consolidator built with React, Tailwind CSS, and the Gemini AI API.

## Features & Stages
1. **Stage 1: Deep Scan & Inventory** - Scans organization repositories and extracts architecture dependency matrices.
2. **Stage 2: Monorepo Assembler** - Detects duplicate files across repositories and builds a cohesive consolidation strategy.
3. **Stage 3: CI/CD Pipeline** - Generates robust GitHub Actions workflows for continuous integration.
4. **Stage 4: CD Release** - Automates generation of Dockerfiles and continuous deployment configurations.
5. **Stage 5: Live Ops** - Simulates live observability and metrics from your deployed workspaces.
6. **Stage 6: Chaos & Security** - Injects fault-tolerance experiments and evaluates auto-healing resilience.
7. **Stage 7: EMG Memory Core** - **(New!)** An Enhanced Memory Graph vector database subsystem that acts as the core memory node for background AI agents. Includes a dedicated chat interface for querying deep repository memory vectors.

## Recent Updates
- **Minimalist UI**: The application has been updated with a high-contrast, minimalist "true black" console interface for maximum readability and focus.
- **Auto-Push Integration**: The export manifest generation has been replaced with a streamlined "Auto-Push" mechanism. Once an audit is complete, reports are automatically staged to be pushed directly into the central `Repository-Auditor` GitHub target repository, saving screen real estate.
- **Background Agents**: The EMG Memory Core can now spawn background agent loops to continuously analyze structural constraints based on DeepMind and IBM patterns.

## Getting Started
Ensure you have set the `GEMINI_API_KEY` in your `.env` file. You can then run the local server using:


