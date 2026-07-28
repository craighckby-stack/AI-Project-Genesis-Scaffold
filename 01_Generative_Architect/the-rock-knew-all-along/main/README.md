# Repository Architectural Manifest: THE-ROCK-KNEW-ALL-ALONG

> **Distillation Status**: AUTO-GENERATED
> **Engine Specification**: HUXLEY_REASONING_ENGINE_V3.2 (Tri-Loop)
> **Identity Guard**: DEFAULT
> **Genetic Siphon**: INACTIVE
> **License Notice**: NOT FOR COMMERCIAL USE WITHOUT PURCHASE. Contact administrator for commercial licensing options.
> **Analysis Scope**: 5 unique logic files across multiple branches.

### Polymorphic Ingestion Layer
**File:** ApiGemini.py
**Target Branch**: `ingestion/polymorphic-streamer`

> Abstracts varied binary and text formats into a unified string stream using external process execution for layout-aware PDF extraction.

**Alignment**: 85%
**CCRR (Certainty-to-Risk)**: 0.88/10
**Philosophy Check**: A system must be permeable to all forms of knowledge before it can claim to synthesize truth.

#### Strategic Mutation
* Implement a generator-based streaming reader to handle multi-gigabyte document processing without causing OOM crashes in restricted environments.

```typescript
def read_file(filepath, filename):
    ext = filename.lower()
    if ext.endswith(".pdf"):
        result = subprocess.run(["pdftotext", "-layout", filepath, "-"], capture_output=True, timeout=120)
        return result.stdout.decode("utf-8", errors="ignore").strip()
    elif ext.endswith((".docx", ".doc")):
        doc = Document(filepath)
        return "\n".join(p.text for p in doc.paragraphs).strip()
    else:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
```

---
### Transient API Resilience Loop
**File:** ApiGemini.py
**Target Branch**: `api/resilience-loop`

> Handles non-deterministic network failure and strict API rate-limiting via recursive retry logic and specific exception branching.

**Alignment**: 92%
**CCRR (Certainty-to-Risk)**: 0.91/10
**Philosophy Check**: Patience is a technical requirement; the machine must wait for the universe to be ready for its query.

#### Strategic Mutation
* Integrate a Circuit Breaker pattern that halts all requests if the failure rate exceeds a specific threshold, preserving API health.

```typescript
def ask_gemini(content, retries=3):
    for attempt in range(retries):
        try:
            resp = model.generate_content(content)
            return resp.text
        except Exception as e:
            err = str(e)[:120]
            if "quota" in err.lower() or "429" in err:
                time.sleep(30)
            elif attempt < retries - 1:
                time.sleep(5)
            else:
                raise
```

---
### Fractal Narrative Synthesis
**File:** ApiGemini.py
**Target Branch**: `engine/semantic-fragmentation`

> Divides monolithic data into semantic fragments to bypass context window constraints while injecting specific persona-driven constraints.

**Alignment**: 95%
**CCRR (Certainty-to-Risk)**: 0.85/10
**Philosophy Check**: Reality is best understood in small, slightly distorted doses.

#### Strategic Mutation
* Introduce a Recursive Compression layer where the final summary is itself summarized to ensure architectural coherence across fragments.

```typescript
def summarise(filename, text):
    MAX = 6000
    chunks = [text[i:i+MAX] for i in range(0, len(text), MAX)]
    summary = ""
    for i, chunk in enumerate(chunks):
        prompt = (f"Summarise this document fragment scientifically but faintly unhinged...\nFile: {filename}\n---\n{chunk}")
        summary += ask_gemini(prompt) + "\n\n"
        time.sleep(1)
    return summary.strip()
```

---
### Sovereignty Metadata Anchor
**File:** README.md
**Target Branch**: `core/sovereignty-anchor`

> Enforces architectural sovereignty by embedding philosophical inquiries into the generated metadata of all output artifacts.

**Alignment**: 98%
**CCRR (Certainty-to-Risk)**: 0.99/10
**Philosophy Check**: A system's identity is defined by its immutable output signatures.

#### Strategic Mutation
* Transform the static footer into a cryptographic hash of the document content to ensure data integrity and provenance.

```typescript
## Notes
- The footer of every output PDF asks "does a rock know this is page N?"
- This is non-negotiable.
```

---
### Dynamic Dependency Injection
**File:** ApiGemini.py
**Target Branch**: `infra/provisioning-layer`

> Uses shell-level escapes to provision the runtime environment dynamically, ensuring functional DNA is active regardless of host pre-configuration.

**Alignment**: 75%
**CCRR (Certainty-to-Risk)**: 0.68/10
**Philosophy Check**: The machine must first construct its own universe before it can inhabit it.

#### Strategic Mutation
* Encapsulate environment provisioning into a containerized build process to eliminate platform-specific syntax errors during deployment.

```typescript
!pip install -q google-generativeai pdfplumber python-docx fpdf2
!apt-get install -qq poppler-utils
```
