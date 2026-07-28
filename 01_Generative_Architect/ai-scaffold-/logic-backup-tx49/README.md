markdown

---
## ⚠️ Build Analysis: FAILED
> **Architect Note:** The repository structure is currently corrupted by non-standard naming conventions for core directories (e.g., '@@@src', '@@@prisma', '@@@.env.local'), which prevents standard Next.js and Prisma build pipelines from locating the source and schema. Additionally, the presence of '__MACOSX' resource fork metadata and inconsistent root-level reports indicates an uncleaned development state. To fix: Rename '@@@' prefixed folders to standard names and define a global requirements.txt for the Python-based skill dependencies.
*Detected issues in project structure or dependency logic during heuristic scan.*