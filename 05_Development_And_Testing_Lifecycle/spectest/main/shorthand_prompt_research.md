# Semantic Compression in Large Language Models: Testing Intent Preservation Through Shorthand Prompting

**Author:** Anonymous Research Group  
**Date:** May 17, 2026  
**Status:** Experimental Findings

---

## Abstract

This paper investigates whether significantly condensed (shorthand) prompts can preserve semantic intent and architectural coherence when passed between multiple language models, effectively achieving ~70-80% token reduction without meaningful fidelity loss. Through three controlled experiments spanning code generation, system architecture reconstruction, and narrative expansion, we demonstrate that core intent transfers reliably across different model architectures (GPT-4 Mini, Gemini, Claude Sonnet, GLM-5-Turbo) while output quality varies predictably by model capability. Processing time analysis reveals a trade-off between output fidelity and latency, with higher-capability models requiring significantly longer deliberation (4 minutes vs. 30 seconds) to produce superior prose quality.

---

## 1. Introduction

### 1.1 Problem Statement

Current best practices in prompt engineering emphasize **clarity, specificity, and verbosity**—longer prompts are assumed to yield better results. However, this approach carries hidden costs:

- **Token consumption scales linearly** with prompt length
- **API costs increase proportionally** to input tokens
- **Latency compounds** across multi-turn interactions
- **Context windows become bottlenecks** in complex workflows

We hypothesize that **semantic intent can be compressed** into minimal, structured shorthand without losing essential information, provided:

1. The core architectural concept is preserved
2. The target model has sufficient capability to decompress the intent
3. Output quality is measured against intent-matching, not pixel-perfect reproduction

### 1.2 Research Questions

1. **Can ~70% token reduction maintain semantic coherence?**
2. **How does model capability affect shorthand comprehension?**
3. **What is the quality-latency trade-off across model tiers?**
4. **Can shorthand work bidirectionally (code ↔ prose)?**

---

## 2. Methodology

### 2.1 Experimental Design

Three sequential experiments tested shorthand prompting at increasing complexity:

| Experiment | Domain | Input | Output | Token Reduction |
|-----------|--------|-------|--------|-----------------|
| 1 | Code Generation | Verbose prompt | JavaScript function | 67% |
| 2 | System Architecture | 2000-word spec | React app rebuild | 85% |
| 3 | Narrative Expansion | Code structure | 1500-word prose | 72% |

### 2.2 Experiment 1: Logarithmic Random Number Generation

**Full Prompt (113 tokens):**

