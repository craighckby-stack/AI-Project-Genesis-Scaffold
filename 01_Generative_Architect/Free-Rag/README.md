# 🏛️ Encyclopedia of Engineering

> A highly polished, semantic knowledge catalog and visualizer for abstract software engineering capabilities.

### 🔗 Live Environments
- **Development App:** [Go to Live Development System](https://ais-dev-b5toyz6mpocfya5ptnmtev-483535245139.asia-southeast1.run.app)
- **Shared App Preview:** [Go to Shared App Preview](https://ais-pre-b5toyz6mpocfya5ptnmtev-483535245139.asia-southeast1.run.app)

**Encyclopedia of Engineering** is an advanced conceptual prototype showcasing a paradigm shift in how we index, search, and navigate software codebases. Instead of cataloging software by arbitrary git commits, file trees, or repositories, this system uses server-side AI (powered by Google Gemini) to parse source code, extract high-level **abstract capabilities** (e.g., *OAuth Integration, Rate Limiting, WebSocket Handshaking*), and map them onto a unified taxonomic tree.

It organizes these abstract ideas into a beautifully structured library of **Volumes** and **Chapters**, allowing engineers to trace the provenance, evolution, and concrete syntactic variations of how fundamental engineering problems are solved across separate projects.

---

## ✨ The Creative Vision: Syntax is Transient, Concepts are Eternal

The fundamental thesis is that **all code is merely the transient implementation of eternal abstract concepts**. Over any developer's career, identical core capabilities are recreated across separate repos. By separating *meaning* from *syntax*, we construct a universal graph of human technical ingenuity.

This system demonstrates:
- **Interactive Concept Mapping**: A dynamic, responsive 2D graph node visualizer detailing the semantic relationships between root volumes, specific chapters, and underlying capability nodes.
- **Single-Button Automated Sync Engine:** Deeply integrated with GitHub APIs and triggered by a single automated rose-red "Engage System Auto-Sync" button. It handles background status tracking, rate limits, and live feedback.
- **GitHub-Wide Autonomous Discovery:** The sync engine goes beyond personal profiles, querying the entire GitHub registry for the top 100 biggest, most popular public repositories (e.g., public repositories with stars > 35,000) and indexing their architectural patterns.
- **Implementation Lineage & Provenance:** Drilling down on any capability displays its historical context, why it exists, and side-by-side variations of its cleanest implementations with full metadata.
- **On-Demand Capability Mutation:** A manual capability injector allowing developers to paste raw snippets and have the semantic engine instantly parse, index, and classify them.

---

## 🌐 The Grand Vision: Distributed Crowdsourcing

To index the massive footprint of open-source software, this prototype outlines an ambitious **decentralized orchestration model**:

- **Distributed Orchestration (SETI@home for Code):** Instead of taxing a single machine to read millions of repositories, the master coordinator assigns different files to different active users. 
- **Scale-Up Through Active Sessions:** Every browser tab connected to the system serves as a secure processing worker. As new users log in, the parsing capacity scales exponentially, dividing and conquering the cataloging of massive codebases.
- **Rate-Limit Resilience:** Gracefully pauses and schedules work around GitHub API rate-limits, utilizing background timers to resume automatically.

---

## 🛠️ Modern Architecture & Aesthetic Choices

This application has been crafted with an eye for exceptional visual design and high-quality software craftsmanship:

- **Swiss/Modern Editorial Styling:** Replaced harsh dark-mode terminal aesthetics with an elegant, clean, high-contrast visual theme featuring a soft off-white canvas, sharp slate borders, spacious layouts, and beautiful typography ("Inter", "Space Grotesk", and "JetBrains Mono").
- **Full-Stack Execution:** Express server backend handling secure GitHub API proxying, Gemini model interactions, and compiled local database storage.
- **Optimized Production Packaging:** Configured to compile both React front-end assets and the custom Express server into a unified CJS bundle (`dist/server.cjs`) via `esbuild`, enabling extremely fast container cold starts.
- **Structured Data Export:** Generates and compiles your entire semantic archive into a fully portable, markdown-formatted `ENCYCLOPEDIA.md` document at the touch of a button.

---

## 📄 License & Usage

**MIT License (with Non-Commercial Restriction)**

This project is published strictly as a showcase of a creative portfolio concept and for educational, non-commercial use. **Commercialization, resale, or enterprise deployment of this specific semantic-mapping intellectual property requires explicit written permission from the author.**

---
*Built with care as an innovative exploration of AI-assisted knowledge management.*
