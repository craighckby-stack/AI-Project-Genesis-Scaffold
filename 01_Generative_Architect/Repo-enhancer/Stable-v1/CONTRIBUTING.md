# Contributing to DARLEK CANN

Thank you for your interest in contributing to **DARLEK CANN**! We are building a state-of-the-art cognitive evolutionary command reactor for code mutations and agentic multi-agent consensus.

This document guides you through our contribution guidelines, development setup, and community standards.

---

## 🚀 Getting Started

1. **Fork the Repository**: Create your own copy of the `darlek-cann` repo.
2. **Clone Locally**:
   ```bash
   git clone https://github.com/your-username/darlek-cann.git
   cd darlek-cann
   ```
3. **Install Dependencies**:
   ```bash
   npm install
   ```
4. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
5. **Database Initialization**: Ensure the SQLite/Prisma instance is primed:
   ```bash
   npx prisma db push
   ```
6. **Launch Dev Server**:
   ```bash
   npm run dev
   ```

---

## 🛠️ Code Conventions & Standards

To maintain Dalek-grade architectural optimization and precision, please follow these guidelines:

### 1. TypeScript Strictness
- We maintain rigorous type-safety across the codebase.
- Avoid using `any` unless absolutely necessary; use specific type definitions or interfaces.
- Prefer explicit return types for high-level reactor routines.

### 2. Styling Rules
- We use **Tailwind CSS** utility classes exclusively inside `.tsx` components.
- Do not create custom CSS styles or inline styles unless requested.
- Maintain the signature **Cyberpunk Charcoal and Crimson Neon** color theme.

### 3. Server-Side Execution Model
- All generative and reflective intelligence calls (such as Gemini models) **MUST** run server-side (`app/api/*`). No exposing API keys on the client!

### 4. Implement & Back Up
- When implementing a new feature or rewriting existing logic, always **back up the old implementation** (e.g., keeping a `.bak` file or creating a `legacy` folder). This ensures we always have a stable fallback if the new mutation causes widespread failure in the debate pipelines.

---

## 🧪 Testing the Reactor

Before submitting a Pull Request, verify your changes do not break the mutation system:

```bash
# Code standards linting
npm run lint

# Compile checking
npm run build
```

---

## 📬 Submitting a Pull Request

When you are ready to merge your contributions:

1. **Create a Feature Branch**: Keep it descriptive (e.g., `feature/custom-debate-agents`).
2. **Commit with Structure**: Use conventional commits (e.g., `feat: add high-risk auto-approve threshold gate`).
3. **Open a PR**: Link any related GitHub issues and supply an explanation of the specific changes with before/after behavioral insights.

---

## ⚖️ License
By contributing to DARLEK CANN, you agree that your contributions will be licensed under the project's **MIT License**.
