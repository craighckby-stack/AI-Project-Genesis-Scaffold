"""
================================================================================
CORE AGI ECOSYSTEM - INITIALIZATION MODULE (DARLEK CANN v3.0)
================================================================================
Role: Primary entry point for the Core AGI Ecosystem. Orchestrates simulation 
      engines, persona evolution, and primitive learning modules. Enforces strict 
      namespace control and provides diagnostic hooks for system-wide integrity.

Connections:
- 03_Core_AGI_Ecosystem/agi_kernel.py (Kernel Orchestrator)
- 02_Simulation_And_Primitive_Learning/aether_forge/simulation_registry.py (Lifecycle)
================================================================================
"""

import logging
import threading
from typing import Dict, Any, List

# Import siphoned architectural utilities
from ..aether_forge.simulation_registry import SimulationRegistry
from ..aether_forge.siphoned_engine_utils import TelemetryBridge

__version__ = "1.1.0"

# Configure internal logging for the ecosystem
logger = logging.getLogger("Core_AGI_Ecosystem")

# Global simulation registry for cross-module lifecycle management
registry = SimulationRegistry()
telemetry = TelemetryBridge()

# Thread-safe initialization lock
_init_lock = threading.RLock()
_is_initialized = False

__all__ = [
    "initialize_ecosystem",
    "get_ecosystem_status",
    "get_system_integrity_snapshot",
    "clear_registry",
    "shutdown",
    "registry",
    "__version__"
]

def initialize_ecosystem() -> bool:
    """
    Orchestrates the initialization of all sub-modules within the AGI Ecosystem.
    Ensures that simulation engines and persona orchestrators are ready for execution.
    """
    global _is_initialized
    with _init_lock:
        if _is_initialized:
            return True
            
        try:
            logger.info("Initializing Core AGI Ecosystem components...")
            registry.register_module("kernel", {"status": "READY"})
            telemetry.log_event("ECOSYSTEM_INIT", {"version": __version__})
            _is_initialized = True
            return True
        except Exception as e:
            logger.error(f"Critical failure during ecosystem initialization: {e}")
            return False

def get_ecosystem_status() -> Dict[str, Any]:
    """
    Returns the current operational status of the ecosystem components.
    """
    return {
        "version": __version__,
        "status": "OPERATIONAL" if _is_initialized else "PENDING",
        "components": ["EvolutionEngine", "PersonaOrchestrator", "SimulationPlatform"]
    }

def get_system_integrity_snapshot() -> Dict[str, Any]:
    """
    Facilitates temporal debugging by returning a snapshot of the ecosystem.
    """
    with _init_lock:
        return {
            "version": __version__,
            "status": "OPERATIONAL" if _is_initialized else "PENDING",
            "registry_snapshot": registry.get_system_integrity_snapshot(),
            "telemetry_health": telemetry.get_system_integrity_snapshot()
        }

def clear_registry() -> None:
    """
    Purges registry and telemetry history to support high-frequency simulation resets.
    """
    with _init_lock:
        registry.clear_registry()
        telemetry.clear_history()
        logger.info("Core AGI Ecosystem registry and telemetry history purged.")

def shutdown() -> None:
    """
    Zero-leak cleanup of ecosystem resources.
    """
    with _init_lock:
        registry.shutdown()
        telemetry.clear_history()
        logger.info("Core AGI Ecosystem shutdown sequence complete.")

# Execute self-check on import
if __name__ == "__main__":
    initialize_ecosystem()