"""
DNA Regulator
=============

PURPOSE:
    DNA-based regulator core — computational thinking control.
    Manages genetic expression state and regulates system-wide AGI behavior 
    based on encoded regulatory sequences.

STATUS:
    ACTIVE — Synthesized from core lineage patterns.

INTEGRATION:
    - dna_regulator_utils.py: Provides validation and telemetry helpers.
    - agi_kernel.py: Consumes regulatory signals for kernel state adjustment.
"""

from __future__ import annotations
import logging
from typing import Dict, Any, Callable
from .dna_regulator_utils import (
    validate_dna_sequence, 
    compute_expression_score, 
    execute_regulation_step
)

class DnaRegulator:
    """
    Core regulator for AGI genetic expression.
    Maintains a registry of regulatory sequences and their associated logic.
    """
    def __init__(self):
        self._registry: Dict[str, Callable[[], bool]] = {}
        self._state: Dict[str, Any] = {
            "last_update": None,
            "expression_levels": {},
            "is_active": True
        }
        self.logger = logging.getLogger("DnaRegulator")

    def register_sequence(self, name: str, sequence: str, logic: Callable[[], bool]):
        """Registers a new regulatory sequence with associated logic."""
        if not validate_dna_sequence(sequence):
            raise ValueError(f"Invalid DNA sequence provided for {name}")
        
        self._registry[name] = logic
        self._state["expression_levels"][name] = compute_expression_score(sequence)
        self.logger.info(f"Registered regulatory sequence: {name}")

    def trigger_regulation(self, name: str) -> bool:
        """Triggers the logic associated with a specific regulatory sequence."""
        if name not in self._registry:
            self.logger.warning(f"Sequence {name} not found in registry.")
            return False
        
        passed, duration = execute_regulation_step(self._registry[name])
        self.logger.debug(f"Regulation step {name} completed in {duration}ms. Status: {passed}")
        return passed

    def get_system_status(self) -> Dict[str, Any]:
        """Returns the current state of the DNA regulator."""
        return {
            "active": self._state["is_active"],
            "registered_count": len(self._registry),
            "expression_data": self._state["expression_levels"]
        }

# Singleton instance for ecosystem-wide access
dna_regulator = DnaRegulator()