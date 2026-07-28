# Gibberish: Synthesis Hub

A professional-grade document orchestration and synthesis platform. Gibberish leverages Google Gemini AI to ingest diverse media (text and images) and process them through a multi-kernel analytical framework.

## Core Features
- **Multi-Kernel Analysis**: 9 specialized perspectives (Empirical, Adversarial, Ethical, etc.).
- **Multi-Modal Ingestion**: Support for text and images with claim extraction.
- **Synthesis Styles**: High-fidelity Academic vs. Plain output formats.
- **Grounded Claims**: Mapping synthesized outputs back to source IDs.

## Tech Stack
- **React 19 / Vite 6**
- **Tailwind CSS 4**
- **Google Generative AI (@google/genai)**
- **Motion** (Animation)

## Setup
1. `npm install`
2. Create `.env` with `GEMINI_API_KEY`.
3. `npm run dev`

---
## ✅ Build Analysis: PASS
> **Recommended Build:** The project uses Vite 6 and React 19. Tailwind CSS 4 is correctly configured via the @tailwindcss/vite plugin. Environment variables are properly mapped through define in vite.config.ts. Recommendation: Use 'npm run build' for production deployment. Ensure the GEMINI_API_KEY is provided at build time or via the .env file.