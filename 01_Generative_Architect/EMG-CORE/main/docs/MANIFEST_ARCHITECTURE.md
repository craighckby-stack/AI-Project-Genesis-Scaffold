# DARLEK CANN System Manifest Architecture

## Overview
The `system-manifest.schema.json` serves as the source of truth for all DARLEK CANN deployments. It enforces a strict 3-tier LLM fallback strategy and ensures that every agent instance maintains a valid quantum signature.

## Integration Workflow
1. **Validation**: Every deployment pipeline must run `ajv` validation against this schema.
2. **Orchestration**: The `AgentOrchestra` module reads the `architecture` block to determine the fallback sequence.
3. **Evolution**: The `selfEvolution` flag triggers the `DARLEK_CANN_ENGINE` to initiate self-patching cycles.

## Schema Constraints
- `version` must follow SemVer.
- `fallbackLayers` must contain at least 3 distinct LLM providers/models.
- `environment` must be explicitly defined to prevent production leakage.