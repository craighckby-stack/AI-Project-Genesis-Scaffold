"""
================================================================================
SIMULATION REGISTRY - AETHER FORGE CORE
================================================================================
Role: Thread-safe registry for managing simulation modules and lifecycle hooks.
      Ensures atomic registration and observability across the Aether Forge ecosystem.
      Evolved to support high-frequency resets and diagnostic telemetry.

Connections:
- 02_Simulation_And_Primitive_Learning/aether_forge/__init__.py (Initialization)
- 02_Simulation_And_Primitive_Learning/aether_forge/siphoned_engine_utils.py (Telemetry)
================================================================================
"""

import threading
import logging
import time
from typing import Dict, Any, List

# Import siphoned architectural utilities
from .siphoned_engine_utils import TelemetryBridge

logger = logging.getLogger("SimulationRegistry")

class SimulationRegistry:
    """
    Thread-safe registry for managing simulation modules.
    Implements audit-ready telemetry and atomic state management.
    """
    def __init__(self):
        self._modules: Dict[str, Any] = {}
        self._lock = threading.RLock()
        self._telemetry = TelemetryBridge()
        logger.info("SimulationRegistry initialized with TelemetryBridge.")

    def register_module(self, name: str, module: Any) -> None:
        """Registers a module with audit-ready telemetry."""
        with self._lock:
            self._modules[name] = module
            self._telemetry.log_event("MODULE_REGISTERED", {"name": name})
            logger.info(f"Module '{name}' registered in Aether Forge.")

    def get_module(self, name: str) -> Any:
        """Retrieves a registered module."""
        with self._lock:
            return self._modules.get(name)

    def get_all_module_names(self) -> List[str]:
        """Returns a list of all registered module names."""
        with self._lock:
            return list(self._modules.keys())

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """Facilitates temporal debugging by returning a snapshot of the registry and telemetry."""
        with self._lock:
            return {
                "timestamp": time.time(),
                "module_count": len(self._modules),
                "modules": list(self._modules.keys()),
                "telemetry_health": self._telemetry.get_system_integrity_snapshot(),
                "status": "OPERATIONAL"
            }

    def clear_registry(self) -> None:
        """Purges registry and telemetry history to support high-frequency simulation resets."""
        with self._lock:
            self._modules.clear()
            self._telemetry.clear_history()
            logger.info("SimulationRegistry registry and telemetry history purged.")

    def shutdown(self) -> None:
        """Zero-leak cleanup of the registry."""
        with self._lock:
            self._modules.clear()
            logger.info("SimulationRegistry shutdown complete.")