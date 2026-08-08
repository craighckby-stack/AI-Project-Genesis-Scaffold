"""
DNA Regulator
=============

PURPOSE:
    DNA-based regulator core — computational thinking control.
    Manages genetic expression state and regulates system-wide AGI behavior 
    based on encoded regulatory sequences.

ROLE:
    Acts as the 'Epigenetic Orchestrator' for the AGI Kernel. It translates 
    symbolic DNA sequences into active regulatory logic, applying consensus 
    weighting to determine the system's current 'behavioral phenotype'.

INTEGRATION:
    - dna_regulator_utils.py: Core validation and telemetry execution logic.
    - dna_expression_engine.py: Advanced consensus-based expression scoring.
    - dna_regulator_telemetry.py: Structured diagnostic and state reporting.
    - agi_kernel.py: Consumes the 'global_regulatory_signal' to adjust kernel parameters.

SIPHONED PATTERNS:
    - Zero-Leak State Isolation: State is managed via internal dictionaries with strict accessors.
    - Consensus Weighting: Expression scores are dynamically adjusted via an epigenetic layer.
    - High-Precision Telemetry: Every regulation step is timed and logged with microsecond resolution.
"""

from __future__ import annotations
import logging
from typing import Dict, Any, Callable, Optional

# Internal module imports (generated in newFiles)
from .dna_regulator_utils import (
    validate_dna_sequence, 
    compute_expression_score, 
    execute_regulation_step
)
from .dna_expression_engine import DnaExpressionEngine
from .dna_regulator_telemetry import DnaRegulatorTelemetry

class DnaRegulator:
    """
    Core regulator for AGI genetic expression.
    Maintains a registry of regulatory sequences and their associated logic.
    """
    def __init__(self):
        self._registry: Dict[str, Callable[[], bool]] = {}
        self._base_expression_scores: Dict[str, float] = {}
        self._engine = DnaExpressionEngine()
        self._is_active = True
        self.logger = logging.getLogger("DnaRegulator")
        
        self.logger.info("DnaRegulator initialized: Genetic control layer online.")

    def register_sequence(self, name: str, sequence: str, logic: Callable[[], bool]):
        """
        Registers a new regulatory sequence with associated logic.
        
        :param name: Unique identifier for the regulatory sequence.
        :param sequence: DNA string (ACGT).
        :param logic: Boolean function representing the regulatory action.
        """
        if not validate_dna_sequence(sequence):
            self.logger.error(f"Registration failed: Invalid DNA sequence for '{name}'")
            raise ValueError(f"Invalid DNA sequence provided for {name}")
        
        self._registry[name] = logic
        self._base_expression_scores[name] = compute_expression_score(sequence)
        
        self.logger.info(f"Registered regulatory sequence: {name} [Base Score: {self._base_expression_scores[name]}]")

    def trigger_regulation(self, name: str) -> bool:
        """
        Triggers the logic associated with a specific regulatory sequence.
        Captures telemetry and logs the outcome.
        """
        if name not in self._registry:
            self.logger.warning(f"Regulation trigger failed: Sequence '{name}' not found in registry.")
            return False
        
        if not self._is_active:
            self.logger.warning(f"Regulation trigger ignored: Regulator is currently INACTIVE.")
            return False

        passed, duration = execute_regulation_step(self._registry[name])
        
        # Delegate logging to telemetry provider
        DnaRegulatorTelemetry.log_regulation_event(self.logger, name, passed, duration)
        
        return passed

    def set_epigenetic_modifier(self, name: str, multiplier: float):
        """
        Adjusts the expression weight of a specific sequence.
        Siphoned from dynamic consensus weighting patterns.
        """
        self._engine.set_modifier(name, multiplier)
        self.logger.debug(f"Epigenetic modifier updated for '{name}': {multiplier}x")

    def get_global_signal(self) -> float:
        """
        Calculates the aggregate regulatory signal across all registered sequences.
        Used by the AGI Kernel to determine system-wide behavioral shifts.
        """
        effective_scores = self._engine.calculate_effective_expression(self._base_expression_scores)
        return self._engine.get_global_regulatory_signal(effective_scores)

    def get_system_status(self) -> Dict[str, Any]:
        """
        Returns a structured diagnostic report of the DNA regulator state.
        Siphoned from Tessera enterprise diagnostic patterns.
        """
        global_signal = self.get_global_signal()
        return DnaRegulatorTelemetry.generate_report(
            is_active=self._is_active,
            registry_size=len(self._registry),
            global_signal=global_signal
        )

    def set_active_state(self, active: bool):
        """Enables or disables the regulator."""
        self._is_active = active
        self.logger.info(f"DnaRegulator state changed: {'ACTIVE' if active else 'INACTIVE'}")

# Singleton instance for ecosystem-wide access
# This ensures that all modules (Kernel, Simulation, etc.) interact with the same genetic state.
dna_regulator = DnaRegulator()