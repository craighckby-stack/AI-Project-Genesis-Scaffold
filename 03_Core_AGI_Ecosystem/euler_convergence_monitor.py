"""
EULER CONVERGENCE MONITOR
Role: Stability analysis and divergence detection for mathematical models.
Integration: Used by EulerEngine to flag unstable theorems.
"""

from __future__ import annotations
from typing import Dict, List

class ConvergenceMonitor:
    """Monitors the stability of mathematical evolution delta values."""

    def __init__(self, threshold: float = 1000.0):
        self.threshold = threshold
        self.delta_history: Dict[str, List[float]] = {}

    def check_stability(self, theorem_id: str, delta: float) -> str:
        """
        Analyzes the delta to determine the stability status of a theorem.
        Returns: 'STABLE', 'EVOLVING', or 'DIVERGING'.
        """
        if theorem_id not in self.delta_history:
            self.delta_history[theorem_id] = []
        
        self.delta_history[theorem_id].append(delta)
        if len(self.delta_history[theorem_id]) > 10:
            self.delta_history[theorem_id].pop(0)

        if delta > self.threshold:
            return "DIVERGING"
        
        if len(self.delta_history[theorem_id]) < 3:
            return "INITIALIZING"

        # Check if delta is decreasing (converging)
        recent = self.delta_history[theorem_id]
        if recent[-1] < recent[-2] < recent[-3]:
            return "STABLE"
            
        return "EVOLVING"
