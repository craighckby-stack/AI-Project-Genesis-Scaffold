"""
DNA EXPRESSION ENGINE
Role: Manages complex expression logic, consensus weighting, and epigenetic modifiers.
Integration: Delegated from DnaRegulator to keep the main orchestrator clean.
"""

from __future__ import annotations
from typing import Dict, Any, List

class DnaExpressionEngine:
    """
    Handles the computation of 'Consensus Expression' across multiple sequences.
    """
    def __init__(self):
        self._epigenetic_modifiers: Dict[str, float] = {}

    def set_modifier(self, name: str, value: float):
        """Sets a multiplier for a specific sequence's expression."""
        self._epigenetic_modifiers[name] = max(0.0, value)

    def calculate_effective_expression(self, base_scores: Dict[str, float]) -> Dict[str, float]:
        """
        Applies epigenetic modifiers to base expression scores.
        Siphoned from dynamic consensus weighting patterns.
        """
        effective: Dict[str, float] = {}
        for name, score in base_scores.items():
            modifier = self._epigenetic_modifiers.get(name, 1.0)
            effective[name] = round(score * modifier, 4)
        return effective

    def get_global_regulatory_signal(self, effective_scores: Dict[str, float]) -> float:
        """
        Computes a single global signal (0.0 to 1.0) representing system-wide regulation state.
        """
        if not effective_scores:
            return 0.0
        return round(sum(effective_scores.values()) / len(effective_scores), 4)
