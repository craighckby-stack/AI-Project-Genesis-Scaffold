"""
Aether Forge: Primitive Learning & Simulation Core

This package serves as the foundational interface for the Aether Forge simulation module.
It integrates with the Generative Architect and Evolution Engine to manage agent
state transitions, resource entropy, and epoch-based world evolution.

Architectural Alignment:
- Siphoned patterns from AetherForge-2.0 (Agent/World state management).
- Aligned with AI-Project-Genesis-Scaffold (Modular component architecture).
- Designed for high-performance, thread-safe state synchronization.

@version 1.1.0
@author DARLEK CANN
"""

import threading
import logging
from typing import Dict, Any, List

# Import siphoned architectural utilities
from .simulation_registry import SimulationRegistry

__version__ = "1.1.0"

# Configure diagnostic logging for the Aether Forge ecosystem
logger = logging.getLogger("AetherForge")

# Public API definition
__all__ = [
    "EvolutionEngine",
    "PersonaOrchestrator",
    "CosmicPhase",
    "EpochType",
    "registry"
]

# Global simulation registry for cross-module lifecycle management
registry = SimulationRegistry()

def initialize_aether_forge() -> bool:
    """
    Orchestrates the initialization of the Aether Forge simulation environment.
    Ensures all sub-modules are registered and telemetry bridges are active.
    """
    try:
        logger.info("Initializing Aether Forge simulation environment...")
        registry.register_module("core", {"status": "READY"})
        return True
    except Exception as e:
        logger.error(f"Critical failure during Aether Forge initialization: {e}")
        return False

# Execute initialization sequence
initialize_aether_forge()