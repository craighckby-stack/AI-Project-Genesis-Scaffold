# Import System

The branch-based architecture for importing knowledge from multiple sources into your DNA knowledge base.

---

## Overview

The Import System allows you to:

1. **Create branches** for different knowledge domains
2. **Import patterns** from external repositories
3. **Merge branches** into your main DNA
4. **Track provenance** of all patterns

---

## Directory Structure

```
import-system/
├── branch-template/     # Template for new branches
│   ├── dna.txt         # Branch-specific DNA
│   ├── saturation.txt  # Branch-specific constraints
│   └── manifest.json   # Branch metadata
├── branches/           # Active branches
├── merged/             # Merged DNA archives
└── protocols/          # Merge protocols
```

---

## Creating a Branch

```bash
# Copy the template
cp -r import-system/branch-template import-system/branches/my-branch

# Edit the branch files
cd import-system/branches/my-branch
# - dna.txt: Add your patterns
# - saturation.txt: Add constraints
# - manifest.json: Add metadata
```

---

## Branch Manifest

```json
{
  "name": "my-branch",
  "created": "2024-01-15",
  "source": "external-repo/name",
  "patterns_count": 42,
  "status": "active",
  "merge_priority": 1
}
```

---

## Merge Protocol

1. **Validate** - Check branch integrity
2. **Diff** - Compare with existing DNA
3. **Resolve** - Handle conflicts
4. **Merge** - Combine patterns
5. **Archive** - Store branch history

```bash
# Merge a branch
npm run merge --branch=my-branch

# View merge preview
npm run merge --branch=my-branch --dry-run
```

---

## Importing from External Sources

### From GitHub Repository

```bash
# Extract patterns from a repo
npm run import --repo=user/repo --branch=extracted-patterns
```

### From Local Files

```bash
# Import from local codebase
npm run import --local=/path/to/code --branch=local-patterns
```

---

## Conflict Resolution

When patterns conflict, the system uses:

1. **Priority** - Higher priority branch wins
2. **Recency** - Newer patterns override older
3. **Quality** - Better documented patterns win
4. **Manual** - Force specific resolution

---

## Best Practices

1. **One domain per branch** - Keep branches focused
2. **Document sources** - Track where patterns came from
3. **Test before merge** - Validate branch quality
4. **Archive merged branches** - Keep history
5. **Regular cleanup** - Remove stale branches
