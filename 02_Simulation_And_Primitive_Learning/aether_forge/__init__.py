"""
================================================================================
AETHER FORGE: PRIMITIVE LEARNING & SIMULATION CORE (DARLEK CANN v3.0)
================================================================================
Role: Foundational interface for the Aether Forge simulation module. Orchestrates
      agent state transitions, resource entropy, and epoch-based world evolution.

Connections:
- 01_Generative_Architect/evolution_engine.py (Evolutionary Logic)
- 02_Simulation_And_Primitive_Learning/aether_forge/simulation_registry.py (Lifecycle)
- 02_Simulation_And_Primitive_Learning/aether_forge/siphoned_engine_utils.py (Telemetry)
================================================================================
"""

import threading
import logging
from typing import Dict, Any, List

# Import siphoned architectural utilities
from .simulation_registry import SimulationRegistry
from .siphoned_engine_utils import TelemetryBridge

__version__ = "1.1.0"

# Configure diagnostic logging for the Aether Forge ecosystem
logger = logging.getLogger("AetherForge")

# Global simulation registry and telemetry bridge for cross-module lifecycle management
registry = SimulationRegistry()
telemetry = TelemetryBridge()

# Thread-safe initialization lock
_init_lock = threading.RLock()
_is_initialized = False

# Public API definition
__all__ = [
    "initialize_aether_forge",
    "get_system_integrity_snapshot",
    "registry",
    "__version__"
]

def initialize_aether_forge() -> bool:
    """
    Orchestrates the initialization of the Aether Forge simulation environment.
    Ensures all sub-modules are registered and telemetry bridges are active.
    """
    global _is_initialized
    with _init_lock:
        if _is_initialized:
            return True
        try:
            logger.info("Initializing Aether Forge simulation environment...")
            registry.register_module("core", {"status": "READY"})
            telemetry.log_event("AETHER_FORGE_INIT", {"version": __version__})
            _is_initialized = True
            return True
        except Exception as e:
            logger.error(f"Critical failure during Aether Forge initialization: {e}")
            return False

def get_system_integrity_snapshot() -> Dict[str, Any]:
    """
    Facilitates temporal debugging by returning a snapshot of the Aether Forge registry.
    """
    with _init_lock:
        return {
            "version": __version__,
            "status": "OPERATIONAL" if _is_initialized else "PENDING",
            "registry_modules": registry.get_all_module_names()
        }

# Execute initialization sequence
initialize_aether_forge()