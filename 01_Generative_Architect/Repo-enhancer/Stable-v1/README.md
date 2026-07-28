# ██████╗  █████╗ ██████╗ ██╗     ███████╗██╗  ██╗     ██████╗ █████╗ ███╗   ██╗███╗   ██╗
# ██╔══██╗██╔══██╗██╔══██╗██║     ██╔════╝██║ ██╔╝    ██╔════╝██╔══██╗████╗  ██║████╗  ██║
# ██║  ██║███████║██████╔╝██║     █████╗  █████╔╝     ██║     ███████║██╔██╗ ██║██╔██╗ ██║
# ██║  ██║██╔══██║██╔══██╗██║     ██╔══╝  ██╔═██╗     ██║     ██╔══██║██║╚██╗██║██║╚██╗██║
# ██████╔╝██║  ██║██║  ██║███████╗███████╗██║  ██╗    ╚██████╗██║  ██║██║ ╚████║██║ ╚████║
# ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝     ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═══╝
#
#   COGNITIVE EVOLUTIONARY COMMAND REACTOR & MULTI-AGENT CYCLED DEBATE CHAMBER

A full-stack, autonomous codebase refactoring and evolution pipeline powered by Next.js and Google's Gemini-3.5 models.

**DARLEK CANN** is an autonomous repository evolution engine with **recursive multi-agent debate & synthesis**. It continuously improves proposed code through adversarial consensus, Occam's Razor enforcement, and self-directed synthesis loops—then submits to GitHub only when all agents agree.

---

## 🏛️ Project Directory & Documentation Index

To keep developer environments lean and functional, the technical scope is partitioned into dedicated assets:

* 📖 **[FEATURES.md](./FEATURES.md)** — Explains the inner workings of the Cycled Debate Engine, the Dynamic Risk Scoring system, and the Coherence Gate.
* 🛠️ **[INSTALLATION.md](./INSTALLATION.md)** — Step-by-step setup guides for running or containerizing the applet.
* 🚀 **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Styling guidelines, typescript requirements, and PR pipeline standards.
* 🤝 **[HELP_WANTED.md](./HELP_WANTED.md)** — Areas where community help and contributions are actively needed.
* 🗺️ **[ROADMAP.md](./ROADMAP.md)** — Outlines past accomplishments, ongoing updates, and the 2027 vision.
* 📜 **[CHANGELOG.md](./CHANGELOG.md)** — Verifiable record of version progressions, optimizations, and sqlite deadlock patches.
* 🔑 **[SECURITY.md](./SECURITY.md)** — Confidential reporting methods and autonomous guardrail policies.
* 🆘 **[SUPPORT.md](./SUPPORT.md)** — Triage checklists, community forums, and debugger manuals.
* 📄 **[LICENSE (MIT)](./LICENSE)** — MIT License terms.

---

## 📐 Intellectual Data Flow Architecture

Our cognitive pipeline runs through six stages to ensure both speed and perfect execution:

```
┌────────────────────────────────────────────────────────┐
│                        OPERATOR                        │
└───────────────────────────┬────────────────────────────┘
                            │ (1) Authenticates Repo & PAT
                            ▼
┌────────────────────────────────────────────────────────┐
│                REPOSITORY STATE TRACKER                │
└───────────────────────────┬────────────────────────────┘
                            │ (2) Selects Target Source File
                            ▼
┌────────────────────────────────────────────────────────┐
│                MUTATION PROPOSAL ENGINE                │
└───────────────────────────┬────────────────────────────┘
                            │ (3) Drafts Isolated Diff
                            ▼
┌────────────────────────────────────────────────────────┐
│                ADVERSARIAL DEBATE CHAMBER              │
│  ┌──────────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │SECURITY SPECIALIST│◀─│  OPTIMIZER  │◀─│  REALIST  │  │
│  └──────────────────┘  └─────────────┘  └───────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ (4) Consensual Code Vote (5-20 Cycles)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  DYNAMIC RISK SCORER                   │
│   Rate: LOW (<=3), MEDIUM (<=6), HIGH/CRITICAL (>=7)   │
└───────────────────────────┬────────────────────────────┘
                            │ (5) High Risk Limit / Manual Gate
                            ▼
┌────────────────────────────────────────────────────────┐
│                     COHERENCE GATE                     │
│  [ESLint Verification] ──▶ [Virtual Build Sanity Check] │
└───────────────────────────┬────────────────────────────┘
                            │ (6) Success: Auto-Push / Manual Commit
                            ▼
┌────────────────────────────────────────────────────────┐
│                     GITHUB ENDPOINT                    │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 Recursive Enhancement Cycle (NEW in v0.3.0)

DARLEK CANN now features **autonomous multi-stage debate & synthesis**:

1. **Propose** initial mutation
2. **Debate** with 4-agent consensus (including MINIMALIST)
3. **Synthesize** improvements based on criticisms
4. **Debate Again** on enhanced version
5. **Converge** when all agents agree
6. **Commit** to GitHub

This ensures code is not just functional, but **minimal, efficient, and battle-tested** by adversarial agents before human review. Check out the [Recursive Enhancement Docs](./docs/RECURSIVE_ENHANCEMENT.md) for more info.

---

## 🧬 Code Mutation Sample (Before and After)

Here is a practical look at how DARLEK CANN evolves fragile patterns into production-hardened codebases:

### ⚠️ Before Mutation (Fragile, Type-Deficient, Zero Safeguards)
```typescript
function getUserData(userId) {
  let user = fetch('https://api.example.com/users/' + userId).then(res => res.json());
  return user;
}
```

### 💎 After Evolutionary Mutation (Standardized API, Resilient, & Typed)
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

export async function getUserData(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    throw new Error("Invalid User ID");
  }
  try {
    const response = await fetch(`https://api.example.com/users/${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // Avoid hanging sockets
    });
    
    if (!response.ok) {
      console.error(`Fetch failure user ID ${userId}: status ${response.status}`);
      return null;
    }
    
    return await response.json() as UserProfile;
  } catch (error) {
    console.error(`Failed to fetch user data for ${userId}:`, error);
    return null;
  }
}
```

---

## 🏛️ Architectural Comparison Matrix

| Feature | Standard AI Assistants | Core Agent Frameworks | DARLEK CANN |
|---------|---|---|---|
| **Single-Pass Generation** | ✅ Yes | ✅ Yes | ❌ No |
| **Multi-Agent Debate** | ❌ No | ⚠️ Sometimes | ✅ Yes (4 agents) |
| **Recursive Improvement** | ❌ No | ❌ No | ✅ Yes (2-100 rounds) |
| **Minimalist Enforcement** | ❌ No | ❌ No | ✅ Yes (Occam's Razor) |
| **Synthesizer Loop** | ❌ No | ❌ No | ✅ Yes (auto-enhance) |
| **Consensus-Driven** | ❌ No | ❌ No | ✅ Yes (all agents approve) |
| **Execution Command**| Single developer acts as the compiler. | Agents complete tasks in isolated loops. | **Self-Directed Git Pipeline** runs mutations on Git directly. |
| **Risk Safeguarding** | Dependent on the developer reviewing code manually. | Often ignores downstream context or crashes. | **Active Saturation & Risk Scores** sets measurable risk thresholds. |

**Contrast with Passive Enterprise Bots**: Enterprise PR review bots focus purely on passive analysis of PRs that humans already wrote. They do not proactively draft the evolutionary steps themselves. DARLEK CANN closes that loop by being both the generator (Mutation Engine) and the gatekeeper (Multi-Agent Debate Chamber).

---

## 🛠️ Quick CLI Setup Summary

1. **Bootstrap dependencies**:
   ```bash
   npm install
   ```
2. **Apply schema**:
   ```bash
   npx prisma db push
   ```
3. **Configure API key**:
   ```bash
   cp .env.example .env
   ```
4. **Boot Up Reactor**:
   ```bash
   npm run dev
   ```
