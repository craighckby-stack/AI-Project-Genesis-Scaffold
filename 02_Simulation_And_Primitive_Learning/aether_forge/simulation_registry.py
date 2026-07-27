"""
Simulation Registry
===================

PURPOSE:
    Thread-safe registry for managing simulation modules and lifecycle hooks.
    Ensures atomic registration and observability across the Aether Forge ecosystem.
"""

import threading
import logging
from typing import Dict, Any

logger = logging.getLogger("SimulationRegistry")

class SimulationRegistry:
    """
    Thread-safe registry for managing simulation modules.
    """
    def __init__(self):
        self._modules: Dict[str, Any] = {}
        self._lock = threading.RLock()

    def register_module(self, name: str, module: Any) -> None:
        with self._lock:
            self._modules[name] = module
            logger.info(f"Module '{name}' registered in Aether Forge.")

    def get_module(self, name: str) -> Any:
        with self._lock:
            return self._modules.get(name)
