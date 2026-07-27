"""
@file 02_Simulation_And_Primitive_Learning/grog/__init__.py
@description Package initialization for the Grog learning/simulation module.
@role Acts as the entry point for primitive learning agents and simulation logic.
@integration Connects with AetherForge simulation engine and PersonaOrchestrator.

DARLEK CANN v3.0 ARCHITECTURAL EVOLUTION:
- Integrated TelemetryBridge for audit-ready observability.
- Added system integrity snapshotting for diagnostic visibility.
- Added registry clearing for high-frequency simulation resets.
"""

import threading
import logging
from typing import Dict, Any

# Import siphoned architectural utilities
from .grog_core import GrogAgent, GrogEnvironment, LearningState
from ..aether_forge.siphoned_engine_utils import TelemetryBridge

__version__ = "0.1.1"

# Configure diagnostic logging
logger = logging.getLogger("GrogModule")

# Global telemetry bridge for cross-module lifecycle management
telemetry = TelemetryBridge()

# Thread-safe initialization lock
_init_lock = threading.RLock()
_is_initialized = False

__all__ = [
    "GrogAgent",
    "GrogEnvironment",
    "LearningState",
    "get_system_integrity_snapshot",
    "clear_registry",
    "__version__"
]

def initialize_grog_module() -> bool:
    """Initializes the Grog module with required simulation constants and telemetry."""
    global _is_initialized
    with _init_lock:
        if _is_initialized:
            return True
        try:
            logger.info("Initializing Grog module...")
            telemetry.log_event("GROG_MODULE_INIT", {"version": __version__})
            _is_initialized = True
            return True
        except Exception as e:
            logger.error(f"Critical failure during Grog module initialization: {e}")
            return False

def get_system_integrity_snapshot() -> Dict[str, Any]:
    """Facilitates temporal debugging by returning a snapshot of the Grog module."""
    with _init_lock:
        return {
            "version": __version__,
            "status": "OPERATIONAL" if _is_initialized else "PENDING",
            "telemetry_health": telemetry.get_system_integrity_snapshot()
        }

def clear_registry() -> None:
    """Purges telemetry history to support high-frequency simulation resets."""
    with _init_lock:
        telemetry.clear_history()
        logger.info("Grog module telemetry history purged.")

# Execute initialization sequence
initialize_grog_module()