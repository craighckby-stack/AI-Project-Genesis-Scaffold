# Repository Architectural Manifest: EVOLUTION-ENGINE-RAG

> **Distillation Status**: AUTO-GENERATED
> **Engine Specification**: DALEK_CAAN_SIPHON_ENGINE_V3.2
> **Identity Guard**: DEFAULT
> **License Notice**: NOT FOR COMMERCIAL USE WITHOUT PURCHASE. Contact administrator for commercial licensing options.
> **Analysis Scope**: 44 unique logic files across multiple branches.

### Idempotent Tracking ID Allocation
**File:** skills/docx/scripts/document.py

> Provides a state-aware method for ensuring unique identity within OOXML tracked changes, preventing document corruption during recursive insertion cycles.

**Alignment**: 95%
**Philosophy Check**: A system that fails to count its own history is doomed to overwrite its future. Uniqueness is the first law of order.

#### Strategic Mutation
* Implement a centralized ID registry within the DocxXMLEditor to replace O(N) DOM scans with O(1) lookups during high-frequency mutations.

```typescript
def _get_next_change_id(self): max_id = -1; for tag in ("w:ins", "w:del"): elements = self.dom.getElementsByTagName(tag); for elem in elements: change_id = elem.getAttribute("w:id"); if change_id: try: max_id = max(max_id, int(change_id)) except ValueError: pass; return max_id + 1
```

---
### Context-Aware Semantic Chunking
**File:** mini-services/vector-db/index.ts

> The core logic for breaking down unstructured data into digestible fragments for RAG indexing, balanced between size constraints and semantic integrity.

**Alignment**: 88%
**Philosophy Check**: Knowledge is not a monolith; it is a sequence of related atoms. The bridge between atoms determines the strength of the truth.

#### Strategic Mutation
* Introduce overlapping windows (e.g., 10% tail-head overlap) to preserve context boundaries across adjacent chunks, improving retrieval accuracy for edge-case queries.

```typescript
function chunkText(text: string, maxChunkSize: number = 1000): string[] { const sentences = text.split(/([.?!]\s+|\n{2,})/g).filter(s => s.trim().length > 0); const chunks: string[] = []; let currentChunk = ''; for (const part of sentences) { if (currentChunk.length + part.length > maxChunkSize && currentChunk.length > 0) { chunks.push(currentChunk.trim()); currentChunk = part; } else { currentChunk += part; } } if (currentChunk.trim()) { chunks.push(currentChunk.trim()); } return chunks; }
```

---
### Cross-Platform Spatial Validation
**File:** skills/pptx/scripts/html2pptx.js

> Enforces strict layout constraints during the translation from fluid web environments to rigid presentation slides, ensuring visual fidelity across formats.

**Alignment**: 92%
**Philosophy Check**: Constraint is the canvas of creativity. Without boundaries, the architecture collapses into noise.

#### Strategic Mutation
* Implement an auto-scaling logic that dynamically adjusts font sizes or padding when an overflow is detected, transitioning from 'report error' to 'self-heal' mode.

```typescript
async function getBodyDimensions(page) { const bodyDimensions = await page.evaluate(() => { const body = document.body; const style = window.getComputedStyle(body); return { width: parseFloat(style.width), height: parseFloat(style.height), scrollWidth: body.scrollWidth, scrollHeight: body.scrollHeight }; }); const errors = []; const widthOverflowPx = Math.max(0, bodyDimensions.scrollWidth - bodyDimensions.width - 1); const heightOverflowPx = Math.max(0, bodyDimensions.scrollHeight - bodyDimensions.height - 1); if (widthOverflowPt > 0 || heightOverflowPt > 0) { errors.push(`HTML content overflows body...`); } return { ...bodyDimensions, errors }; }
```

---
### Onboarding Orchestration Pipeline
**File:** src/app/api/onboarding/complete/route.ts

> Synchronizes user identity, external repository state, and local project configuration into a unified evolution starting point.

**Alignment**: 97%
**Philosophy Check**: The birth of a system is its most vulnerable moment. Integrity at inception is non-negotiable for eventual complexity.

#### Strategic Mutation
* Wrap the entire onboarding sequence in a database transaction with a compensating action (Saga pattern) to delete the GitHub repository if local user creation fails.

```typescript
export async function POST(request: NextRequest) { const body = await request.json(); const { name, email, githubUsername, githubToken, repoName, consentAccepted, experienceLevel, company, role } = validatedBody; const user = await createUser(...); const githubRepo = await createGitHubRepository(...); await initializeRepositoryContent(githubToken, repoName, user); await createInitialPlaceholders(user.id, experienceLevel); return NextResponse.json({ success: true }); }
```

---
### Heterogeneous Schema Mapping Registry
**File:** skills/docx/ooxml/scripts/validation/base.py

> A centralized lookup table that maps file extensions and document components to their respective ISO standards, forming the foundation of the 'Identity Guard' for document integrity.

**Alignment**: 90%
**Philosophy Check**: The definition of standard is the definition of survival. Divergence from the schema is the beginning of entropy.

#### Strategic Mutation
* Move schema mappings to a JSON configuration file to allow for runtime updates of validation rules without requiring code deployment or service restarts.

```typescript
SCHEMA_MAPPINGS = { "word": "ISO-IEC29500-4_2016/wml.xsd", "ppt": "ISO-IEC29500-4_2016/pml.xsd", "xl": "ISO-IEC29500-4_2016/sml.xsd", "[Content_Types].xml": "ecma/fouth-edition/opc-contentTypes.xsd", ... }
```
