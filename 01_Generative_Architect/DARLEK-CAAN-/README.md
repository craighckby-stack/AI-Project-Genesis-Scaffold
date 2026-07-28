# 🏛️ Encyclopedia of Engineering

> A semantic archive and visualizer for software engineering knowledge.

**Encyclopedia of Engineering** is a conceptual showcase of a new paradigm in code archiving. Instead of browsing code by repository, file, or commit history, this system uses AI to parse codebases and extract abstract **capabilities** (e.g., "OAuth Authentication", "Rate Limiting", "WebSocket Sync").

It maps these capabilities into a beautifully structured "Encyclopedia" of Volumes and Chapters, tracing the provenance and evolution of how engineering problems have been solved across different projects.

## ✨ The Creative Vision

The core idea is that **code is just the implementation of abstract concepts**. Over time, we write the same capabilities over and over across multiple projects. By extracting the *meaning* from the syntax, we can build a universal map of engineering knowledge.

This project demonstrates:
- **Semantic Auto-Syncing:** Directly ingesting GitHub repositories and using AI to map code to concepts.
- **Provenance Tracking:** Ensuring every snippet maintains a direct lineage to its source repo and context.
- **Implementation Variants:** Seeing how a single concept (like "Semantic Search") was implemented across different projects and languages.

## 🌐 The Grand Vision: Indexing All of GitHub

This system was conceived with a highly ambitious theoretical goal: **What if we could analyze the entirety of open-source code on GitHub?**

By leveraging the free tier of the Gemini API, this application can run autonomously in the background, continuously parsing and categorizing code over time. However, the true potential is unlocked through **distributed crowdsourcing**.

Imagine a decentralized network—like SETI@home for software engineering. Every new user who runs this system contributes to a shared, global Encyclopedia. The orchestration layer would dynamically assign *different*, unanalyzed repositories and files to each user's local instance. As more users join the network, the processing power multiplies exponentially. Everyone works together without duplicating effort, rapidly accelerating the timeline to map all of open-source software into a single, universal semantic knowledge graph.

## 🚀 Features

- **GitHub Integration:** Fetches and reads your repositories automatically.
- **Massive Scalability:** Built to handle high-volume processing—proven to synchronize across 80+ repositories simultaneously, gracefully handling everything from 4-file micro-projects to massive 30,000+ file codebases.
- **AI Processing Engine:** Uses Google's Gemini models to perform deep semantic analysis on raw code.
- **Beautiful UI:** A meticulously crafted, responsive interface (React, Tailwind CSS, Lucide Icons) that feels like an elegant library.
- **Markdown Export:** Compiles the entire semantic archive into a portable `ENCYCLOPEDIA.md` report.

## 📄 License & Usage

**MIT License (with Non-Commercial Clause)**

This project is released under a modified MIT License. It is published as a showcase of a creative idea and for educational/portfolio purposes. **Commercial use is strictly prohibited.** Commercialization, resale, or enterprise deployment of this specific semantic-mapping intellectual property requires explicit permission from the author.

---
*Built as an innovative exploration of AI-assisted knowledge management.*
