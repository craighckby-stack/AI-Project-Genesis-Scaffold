# DALEK-GROG Enhancer

> **Self-Optimising AGI Substrate - Run Your Own Evolution Engine**

A complete toolkit for autonomous code evolution. Fork this repo, configure your API keys, and watch your codebase evolve itself.

---

## 🎯 See It In Action

**[Dalek-Grog](https://github.com/craighckby-stack/Dalek-Grog)** - This repo was processed by the evolution engine. Check `evolution_outputs/` to see what happened to the documentation files when they were evolved into code.

---

## What's Included

| Component | Description |
|-----------|-------------|
| **🧬 Siphon Engine** | DALEK_CAAN v3.1 - Architectural pattern extraction & mutation |
| **⚡ Sovereign Enhancer** | Continuous evolution engine with context awareness |
| **📝 DNA Templates** | Blank canvas for your architectural patterns |
| **🔧 Import System** | Branch-based knowledge import architecture |

---

## Quick Start

### 1. Fork & Clone
```bash
# Fork this repo on GitHub, then:
git clone https://github.com/YOUR-USERNAME/dalek-grog-enhancer.git
cd dalek-grog-enhancer
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys:
# - GITHUB_TOKEN (for repo access)
# - CEREBRAS_API_KEY (for LLM)
# - GROK_API_KEY (optional fallback)
# - GEMINI_API_KEY (for enhancer)
```

### 3. Run the Siphon Engine
```bash
cd engine
npm install
npm run dev
# Open http://localhost:3000
```

### 4. (Optional) Run Sovereign Enhancer
```bash
cd enhancer
npm install
npm run dev
```

---

## Components

### 🧬 Siphon Engine (`/engine`)

The DALEK_CAAN siphon engine extracts architectural patterns from world-class repositories and applies them to your codebase.

**Features:**
- Triple-AI Fallback (Gemini → Grok → Cerebras)
- Chained Context v4.4 for consistency
- DNA extraction from source repositories
- Real-time search grounding

**Usage:**
1. Upload a DNA file (architectural patterns)
2. Set saturation guidelines (constraints)
3. Target a GitHub repository
4. Run the siphon

### ⚡ Sovereign Enhancer (`/enhancer`)

A context-aware continuous evolution engine that reads your project's documentation first, then evolves code with full awareness.

**Features:**
- README-priority context priming
- Project-wide awareness
- Automatic mutation commits
- Telemetry dashboard

### 📝 DNA Templates (`/templates`)

- `dna_sample.txt` - Example architectural patterns
- `saturation_sample.txt` - Constraint guidelines
- `blank_dna.txt` - Start from scratch

---

## The Enhancer System (Google AI Studio)

The core enhancer is a **4000+ line system prompt** designed for Google AI Studio.

### How to Use It

1. **Open [Google AI Studio](https://aistudio.google.com/)**
2. **Create a New Prompt**
3. **Copy the contents of `/docs/enhancer-system-prompt.md`**
4. **Paste as System Instructions**
5. **Configure your inputs:**
   - Target repository
   - DNA patterns
   - Saturation guidelines

### Why Not Included Here?

The 4000+ line system is optimized for Google's Gemini API. Running it locally would exhaust most API quotas before completing a single cycle. By sharing the prompt template, you can:

- Run it on **YOUR** Gemini quota
- Modify it for your specific needs
- Use Google's free tier for testing

**See `/docs/enhancer-system-prompt.md` for the full template.**

---

## Import System

The `/import-system` directory contains the branch-based architecture for importing knowledge from multiple sources.

```
import-system/
├── README.md           # How the import system works
├── branch-template/    # Template for new knowledge branches
└── merge-protocol.md   # How to merge branches
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR GITHUB REPO                        │
│  (Fork of dalek-grog-enhancer with your custom DNA)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DALEK_CAAN SIPHON                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Gemini    │→ │    Grok     │→ │  Cerebras   │         │
│  │  (Primary)  │  │  (Fallback) │  │ (Fallback)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DNA KNOWLEDGE BASE                        │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  Patterns     │  │  Constraints  │  │  Signatures   │   │
│  │  (DNA files)  │  │ (Saturation)  │  │ (Extracted)   │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   TARGET CODEBASE                           │
│         (Your project being evolved)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## API Keys Required

| Service | Purpose | Get It |
|---------|---------|--------|
| GitHub | Repo access | [github.com/settings/tokens](https://github.com/settings/tokens) |
| Cerebras | Fast LLM | [cerebras.ai](https://cerebras.ai) |
| Grok | Fallback LLM | [x.ai](https://x.ai) |
| Gemini | Enhancer | [aistudio.google.com](https://aistudio.google.com) |

---

## Costs & Quota Management

### Typical Usage

| Operation | API Calls | Est. Cost |
|-----------|-----------|-----------|
| DNA Extraction | 1-5 calls | ~$0.01 |
| Single File Mutation | 1-3 calls | ~$0.005 |
| Full Repo Scan (100 files) | 100-300 calls | ~$0.50 |

### Quota Tips

1. **Use Cerebras for bulk operations** - Cheaper and faster
2. **Reserve Gemini for complex analysis** - Higher quality
3. **Enable resume mode** - Don't reprocess files
4. **Set saturation constraints** - Limit mutation scope

---

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - Use it, modify it, evolve it.

---

## Credits

- **DALEK_CAAN** - Architectural siphon engine
- **Sovereign** - Context-aware evolution
- **NEXUS_SEED** - AGI substrate framework

---

> "The code evolves itself. We just provide the DNA."
