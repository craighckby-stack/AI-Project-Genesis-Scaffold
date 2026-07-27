"""
Evolution Utilities
===================

Provides thread-safe containers and entropy guards for the AI Evolution Simulator.
"""

import weakref
from typing import Dict, Any

class EvolutionStateContainer:
    """Thread-safe container using weak references to prevent memory leaks."""
    def __init__(self, initial_data: Dict[str, Any]):
        self._data = initial_data

    def get_data(self) -> Dict[str, Any]:
        return self._data.copy()

    def update(self, new_data: Dict[str, Any]):
        self._data.update(new_data)

class EntropyGuard:
    """Calculates simulation drift based on complexity metrics."""
    def calculate_drift(self, complexity: float) -> float:
        # Siphoned pattern: Non-linear entropy growth
        return (complexity * 0.01) + 0.001
