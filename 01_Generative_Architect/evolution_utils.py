"""
================================================================================
EVOLUTION UTILITIES - CORE SIMULATION ENGINE (DARLEK CANN v3.0)
================================================================================
Role: Provides thread-safe state management and diagnostic telemetry hooks 
      for the Generative Architect simulation suite. Now includes bounded 
      event history and integrity snapshotting for audit-ready observability.

Connections:
- 01_Generative_Architect/evolution_engine.py (Evolutionary Logic)
- 01_Generative_Architect/ai_evo_sim.py (Simulation Core)
================================================================================
"""

import threading
import logging
import time
from collections import deque
from typing import Dict, Any, List

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

class EntropyGuard:
    """
    Calculates non-linear entropy drift for simulation stability.
    """
    def __init__(self, drift_coefficient: float = 1.01):
        self.drift_coefficient = drift_coefficient

    def calculate_drift(self, current_entropy: float) -> float:
        return current_entropy * self.drift_coefficient + 0.001

class TelemetryBridge:
    """
    Diagnostic bridge for logging evolutionary events with bounded history.
    """
    def __init__(self, history_max_size: int = 100):
        self._start_time = time.time()
        self._lock = threading.RLock()
        self._event_history: deque[Dict[str, Any]] = deque(maxlen=history_max_size)
        self._event_sequence_num = 0

    def log_event(self, event_type: str, metadata: Dict[str, Any]) -> None:
        """Logs a structured evolutionary event to the diagnostic stream."""
        with self._lock:
            self._event_sequence_num += 1
            log_payload = {
                "timestamp": time.time(),
                "uptime": round(time.time() - self._start_time, 2),
                "sequence_num": self._event_sequence_num,
                "event_type": event_type,
                "data": metadata
            }
            logger.info(f"[TELEMETRY] {event_type} | Data: {log_payload}")
            self._event_history.append(log_payload)

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """Facilitates temporal debugging by returning a snapshot of the telemetry bridge."""
        with self._lock:
            return {
                "timestamp": time.time(),
                "status": "OPERATIONAL",
                "uptime": round(time.time() - self._start_time, 2),
                "recent_events_sample": list(self._event_history)[-5:]
            }

    def clear_history(self) -> None:
        """Clears the internal event history for simulation resets."""
        with self._lock:
            self._event_history.clear()
            logger.info("TelemetryBridge: Event history cleared.")