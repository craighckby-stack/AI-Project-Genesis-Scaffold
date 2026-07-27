import threading
from typing import Dict, Any

class EvolutionStateContainer:
    """Thread-safe container for simulation state."""
    def __init__(self, initial_data: Dict[str, Any]):
        self._data = initial_data
        self._lock = threading.RLock()

    def get_data(self) -> Dict[str, Any]:
        with self._lock:
            return self._data.copy()

    def update(self, new_data: Dict[str, Any]):
        with self._lock:
            self._data.update(new_data)

class EntropyGuard:
    """Calculates simulation drift based on complexity metrics."""
    def calculate_drift(self, current_entropy: float) -> float:
        # Siphoned pattern: Non-linear entropy growth
        return (current_entropy * 1.01) + 0.001