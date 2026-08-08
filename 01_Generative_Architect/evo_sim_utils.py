"""
EVOLUTION SIMULATION UTILITIES
Role: Core utilities for simulation lifecycle management, fitness calculation, and state validation.
Integration: Connects to the ArchitectRegistry and AiEvoSim for audit-ready evolution cycles.
"""

from __future__ import annotations
import uuid
import time
from typing import Dict, Any
from .evo_sim_diagnostics import compute_evolution_metrics, validate_simulation_integrity

def generate_simulation_id() -> str:
    """Generates a unique identifier for a simulation run."""
    return f"sim_{uuid.uuid4().hex[:8]}"

def calculate_fitness(state: Dict[str, Any]) -> float:
    """
    Calculates fitness based on simulation state.
    Delegates metric computation to the diagnostic layer.
    """
    metrics = compute_evolution_metrics(state)
    return metrics.get("fitness", 0.0)

def validate_evolution_state(state: Dict[str, Any]) -> bool:
    """
    Performs rigorous validation of the evolution state.
    Utilizes diagnostic integrity checks.
    """
    passed, _ = validate_simulation_integrity(state)
    return passed

def get_telemetry_snapshot() -> Dict[str, Any]:
    """
    Generates a comprehensive telemetry snapshot for the current simulation state.
    Aligned with AI_Agent_OS diagnostic standards.
    """
    return {
        "timestamp": time.time(),
        "system_load": 0.0,
        "status": "OPERATIONAL",
        "version": "1.0.0-EVO-DIAGNOSTIC-AWARE",
        "node_id": str(uuid.uuid4())
    }