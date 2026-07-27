"""
================================================================================
EVOLUTION UTILITIES - CORE SIMULATION ENGINE
================================================================================
Role: Provides thread-safe state management and diagnostic telemetry hooks 
      for the Generative Architect simulation suite.
================================================================================
"""

import threading
import logging
import time
from typing import Dict, Any

logger = logging.getLogger("EvolutionUtils")

class EvolutionStateContainer:
    """
    Thread-safe, atomic container for simulation state.
    """
    def __init__(self, initial_data: Dict[str, Any]):
        self._data = initial_data
        self._lock = threading.RLock()

    def get_data(self) -> Dict[str, Any]:
        with self._lock:
            return self._data.copy()

    def update(self, new_data: Dict[str, Any]) -> None:
        with self._lock:
            self._data.update(new_data)

class TelemetryBridge:
    """
    Diagnostic bridge for logging evolutionary events.
    """
    @staticmethod
    def log_event(event_type: str, metadata: Dict[str, Any]) -> None:
        logger.info(f"[TELEMETRY] {event_type} | Data: {metadata}")
