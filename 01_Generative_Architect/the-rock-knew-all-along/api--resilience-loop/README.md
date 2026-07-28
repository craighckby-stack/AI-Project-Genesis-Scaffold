# Repository Architectural Manifest: THE-ROCK-KNEW-ALL-ALONG

> **Distillation Status**: AUTO-GENERATED
> **Engine Specification**: HUXLEY_REASONING_ENGINE_V3.2 (Tri-Loop)
> **Identity Guard**: DEFAULT
> **License Notice**: NOT FOR COMMERCIAL USE WITHOUT PURCHASE. Contact administrator for commercial licensing options.
> **Analysis Scope**: 4 unique logic files across multiple branches.

### Polymorphic File Ingestion Engine
**File:** ApiGemini.py

> A unified ingestion logic that bridges binary document formats and raw text into a coherent string stream using external process execution and native library parsing.

**Alignment**: 85%
**CCRR (Certainty-to-Risk)**: 0.88/10
**Philosophy Check**: A system must be permeable to all forms of knowledge before it can claim to synthesize truth.

#### Strategic Mutation
* Convert the return type to a generator of text chunks to allow for stream-based processing of massive documents, mitigating memory spikes in restricted Colab environments.

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

> Handles the non-deterministic nature of cloud-based LLM APIs through an exponential backoff-lite strategy specifically tuned for Gemini free tier limits.

**Alignment**: 92%
**CCRR (Certainty-to-Risk)**: 0.91/10
**Philosophy Check**: Patience is a technical requirement; the machine must wait for the universe to be ready for its query.

#### Strategic Mutation
* Integrate a Circuit Breaker pattern that tracks consecutive failures across different threads, halting execution if the API health drops below 40%.

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
### Semantic Fragmentation Protocol
**File:** ApiGemini.py

> Divides monolithic documents into discrete semantic fragments to bypass LLM context window constraints while maintaining data integrity via UTF-8 normalization.

**Alignment**: 90%
**CCRR (Certainty-to-Risk)**: 0.85/10
**Philosophy Check**: The whole is merely the sum of slightly distorted parts.

#### Strategic Mutation
* Implement semantic overlapping where each chunk contains 10% of the previous chunk's tail to maintain narrative continuity across fragments.

```typescript
MAX = 6000
chunks = [text[i:i+MAX] for i in range(0, len(text), MAX)]
chunks = chunks[:10]
for i, chunk in enumerate(chunks):
    chunk = chunk.encode("utf-8", "ignore").decode("utf-8")
    if len(chunk.strip()) < 50:
        continue
```

---
### Persona-Driven Narrative Synthesis
**File:** ApiGemini.py

> Injects a specific high-entropy persona into the LLM latent space, forcing the model to balance academic rigor with creative absurdity.

**Alignment**: 98%
**CCRR (Certainty-to-Risk)**: 0.78/10
**Philosophy Check**: Objectivity is a lie; the machine must embrace the madness of its creator.

#### Strategic Mutation
* Move the persona definition to a configurable YAML manifest to allow 'Craig-mode' or 'Pure-Academic' modes without modifying the core logic.

```typescript
prompt = (
    f"Summarise this document fragment scientifically but faintly unhinged. "
    f"150 words max. Be honest about what's in it even if it's a guy named Craig "
    f"shutting down the internet or a drill press time machine.\n\n"
    f"File: {filename} (part {i+1}/{len(chunks)})\n---\n{chunk}"
)
```

---
### Selective Directory Filtration
**File:** ApiGemini.py

> A gatekeeper logic that filters the environment for supported document types while ignoring hidden system files or temporary metadata.

**Alignment**: 88%
**CCRR (Certainty-to-Risk)**: 0.94/10
**Philosophy Check**: Selection is the first step of architectural sovereignty.

#### Strategic Mutation
* Upgrade to a recursive glob pattern with size-threshold filtering to prevent the engine from attempting to ingest massive binary datasets accidentally.

```typescript
valid_ext = (".pdf", ".docx", ".doc", ".txt", ".md", ".json", ".py")
files = [f for f in os.listdir(content_dir) if f.lower().endswith(valid_ext) and not f.startswith(".")]
```

---
### Dynamic Environment Bootstrap
**File:** ApiGemini.py

> Inline dependency management designed for ephemeral cloud environments, ensuring all external binaries are present before execution.

**Alignment**: 70%
**CCRR (Certainty-to-Risk)**: 0.65/10
**Philosophy Check**: Infrastructure should be invisible, yet it is the only thing holding the sky up.

#### Strategic Mutation
* Abstract dependencies into a containerized environment file to separate system setup from functional logic, increasing portability.

```typescript
!pip install -q google-generativeai pdfplumber python-docx fpdf2
!apt-get install -qq poppler-utils
```
