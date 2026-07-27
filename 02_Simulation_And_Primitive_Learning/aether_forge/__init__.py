"""
Aether Forge: Primitive Learning & Simulation Core

This package serves as the foundational interface for the Aether Forge simulation module.
It integrates with the Generative Architect and Evolution Engine to manage agent
state transitions, resource entropy, and epoch-based world evolution.

Architectural Alignment:
- Siphoned patterns from AetherForge-2.0 (Agent/World state management).
- Aligned with AI-Project-Genesis-Scaffold (Modular component architecture).
- Designed for high-performance, thread-safe state synchronization.

@version 1.0.0
@author DARLEK CANN
"""

__version__ = "1.0.0"

# Public API definition for the Aether Forge module.
# Future sub-modules (e.g., .engine, .types, .utils) will be exposed here.
__all__ = [
    "EvolutionEngine",
    "PersonaOrchestrator",
    "CosmicPhase",
    "EpochType"
]

# Placeholder for future lazy-loading of core components to maintain 
# clean namespace and prevent circular dependency leaks.
# from .engine import EvolutionEngine
# from .orchestrator import PersonaOrchestrator
# from .types import CosmicPhase, EpochType
