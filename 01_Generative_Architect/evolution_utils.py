"""
================================================================================
EVOLUTION UTILITIES - CORE SIMULATION ENGINE
================================================================================
Role: Provides thread-safe state management, entropy drift calculation, and 
      diagnostic telemetry hooks for the Generative Architect simulation suite.

Connections:
- 01_Generative_Architect/ai_evo_sim.py (Evolution Engine)
- 01_Generative_Architect/enhanced_self_evolving_system.py (System Orchestrator)
================================================================================
"""

import threading
import logging
import time
from typing import Dict, Any, Optional

# Configure diagnostic logging for observability
logger = logging.getLogger("EvolutionUtils")

class EvolutionStateContainer:
    """
    Thread-safe, atomic container for simulation state.
    Prevents race conditions during high-frequency state updates.
    """
    def __init__(self, initial_data: Dict[str, Any]):
        self._data = initial_data
        self._lock = threading.RLock()
        self._last_modified = time.time()

    def get_data(self) -> Dict[str, Any]:
        """Returns a thread-safe copy of the current simulation state."""
        with self._lock:
            return self._data.copy()

    def update(self, new_data: Dict[str, Any]) -> None:
        """Atomically updates the simulation state."""
        with self._lock:
            self._data.update(new_data)
            self._last_modified = time.time()
            logger.debug("State updated successfully.")

    @property
    def last_modified(self) -> float:
        with self._lock:
            return self._last_modified

class EntropyGuard:
    """
    Calculates simulation drift based on complexity metrics.
    Siphoned from AetherForge-2.0 simulation logic for non-linear growth.
    """
    def __init__(self, drift_coefficient: float = 1.01, base_noise: float = 0.001):
        self.drift_coefficient = drift_coefficient
        self.base_noise = base_noise

    def calculate_drift(self, current_entropy: float) -> float:
        """Calculates the next entropy state using non-linear drift coefficients."""
        return (current_entropy * self.drift_coefficient) + self.base_noise

class TelemetryBridge:
    """
    Diagnostic bridge for logging evolutionary events.
    Siphoned from the Audit repository for high-fidelity observability.
    """
    @staticmethod
    def log_event(event_type: str, metadata: Dict[str, Any]) -> None:
        logger.info(f"[TELEMETRY] {event_type} | Data: {metadata}")

__all__ = ["EvolutionStateContainer", "EntropyGuard", "TelemetryBridge"]