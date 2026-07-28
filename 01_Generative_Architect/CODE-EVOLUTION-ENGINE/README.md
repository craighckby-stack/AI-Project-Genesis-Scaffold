# Deep Thinking Lab 🧠

A high-performance reasoning console and evolutionary code optimizer powered by Gemini 3.1 Pro. 

## 🚀 Overview

**Deep Thinking Lab** is designed to be the stable, risk-free alternative to highly experimental multi-agent mutation engines (such as DARLEK CANN). It leverages Gemini's high-reasoning `thinkingLevel` capabilities to analyze, break down, and refactor complex queries and codebases step-by-step. 

By replacing chaotic multi-agent debate loops with a tightly controlled, **two-role strict governance model** (System Reviewer vs. Code Optimizer), it mitigates hallucination risks and produces production-ready, stable code mutations.

## ⚖️ Deep Thinking Lab vs. DARLEK CANN (Repo-Enhancer)

While both systems aim to autonomously evolve codebases, their architectural philosophies differ significantly:

| Feature | DARLEK CANN (Repo-Enhancer) | Deep Thinking Lab (This System) |
| :--- | :--- | :--- |
| **Agent Architecture** | 4-Agent Debate Chamber (High chaos/creativity) | 2-Role Strict Governance (System Reviewer vs Optimizer) |
| **Execution Flow** | Continuous 60s autonomous loop | Deliberate, step-by-step verified execution |
| **Hallucination Risk** | High ("More buttons to play with") | Low (Strict system prompts, deterministic fallbacks) |
| **Network Resilience**| Standard fetches | Exponential backoff & Quota-exceeded auto-fallbacks |
| **Best Used For** | Experimental evolution, wild mutations, emergent behavior | Stable refactoring, security audits, fixing buggy AI systems |

## 💡 The Ultimate Symbiosis
DARLEK CANN is incredibly powerful but prone to bugs and hallucinations due to the sheer complexity of 4 agents arguing simultaneously. **Deep Thinking Lab** is the perfect tool to point *at* the DARLEK CANN repository. You can use this system's risk-free, highly analytical pipeline to debug, optimize, and stabilize DARLEK's code!

## ⚙️ Core Features
*   **Gemini `thinkingLevel` Integration:** Leverages the latest reasoning capabilities (`low`, `high`) of the Gemini 3.1 Pro models.
*   **Exponential Backoff:** Built-in retry mechanisms (`fetchWithRetry`) to handle rate limits and ensure the autonomous loop doesn't crash on network timeouts.
*   **GitHub Integration:** Directly interfaces with GitHub APIs to evaluate tool candidates and securely push validated, improved code.
*   **Automated Scaffolding:** Can dynamically import, classify, and scaffold AI projects into structured directories. 

## 🛠️ Tech Stack
- Frontend: React 19, Vite, Tailwind CSS
- Backend: Express Server, Node.js
- AI: `@google/genai` (Gemini 3.1 Pro Preview)
