# Repository Architectural Manifest: THE-ROCK-KNEW-ALL-ALONG

> **Distillation Status**: AUTO-GENERATED
> **Engine Specification**: DALEK_CAAN_SIPHON_ENGINE_V3.2
> **Identity Guard**: DEFAULT
> **License Notice**: NOT FOR COMMERCIAL USE WITHOUT PURCHASE. Contact administrator for commercial licensing options.
> **Analysis Scope**: 3 unique logic files across multiple branches.

### Polymorphic Document Ingestion Strategy
**File:** ApiGemini.py

> This logic chunk abstracts varied binary and text formats into a unified string stream, utilizing external process execution for layout-aware PDF extraction.

**Alignment**: 85%
**Philosophy Check**: A system must be permeable to all forms of knowledge before it can claim to synthesize truth.

#### Strategic Mutation
* Implement a generator-based streaming reader to handle multi-gigabyte document processing without causing OOM crashes in restricted Colab environments.

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

> This architectural pattern handles non-deterministic network failure and strict API rate-limiting via a recursive retry mechanism with specific exception branching.

**Alignment**: 90%
**Philosophy Check**: Patience is a technical requirement; the machine must wait for the universe to be ready for its query.

#### Strategic Mutation
* Integrate a Circuit Breaker pattern that halts all requests if the failure rate exceeds a threshold, preserving API health during maintenance windows.

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

> Divides monolithic data into semantic fragments to bypass context window constraints while injecting specific persona-driven constraints into the latent space.

**Alignment**: 95%
**Philosophy Check**: Reality is best understood in small, slightly distorted doses.

#### Strategic Mutation
* Introduce a 'Recursive Compression' layer where the final summary is itself summarized to ensure architectural coherence across disparate fragments.

```typescript
def summarise(filename, text):
    MAX = 6000
    chunks = [text[i:i+MAX] for i in range(0, len(text), MAX)]
    summary = ""
    for i, chunk in enumerate(chunks):
        prompt = (f"Summarise this document fragment scientifically but faintly unhinged... {filename} (part {i+1})")
        summary += ask_gemini(prompt) + "\n\n"
    return summary.strip()
```
