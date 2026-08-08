"""
SINGULARITY LOOP UTILITIES
Role: Helper utilities for recursive convergence, state delta computation, and loop telemetry.
Integration: Imported by singularity_loop.py to compute convergence metrics cleanly.
Architectural Note: Delegated core telemetry logic to singularity_telemetry_core.py.
"""

from __future__ import annotations
from typing import Dict, Any
from .singularity_telemetry_core import (
    calculate_state_delta, 
    generate_loop_telemetry_metadata,
    ConvergenceResult
)

def compute_convergence_delta(current_state: Dict[str, Any], previous_state: Dict[str, Any]) -> ConvergenceResult:
    """
    Calculates the delta between two states to measure convergence progress.
    Returns a structured ConvergenceResult containing the delta and metadata.
    """
    delta = calculate_state_delta(current_state, previous_state)
    return ConvergenceResult(
        delta=delta,
        is_converging=(delta < 1000.0), # Threshold for convergence stability
        metadata={"previous_len": len(str(previous_state)), "current_len": len(str(current_state))}
    )

def validate_loop_integrity(state: Dict[str, Any]) -> bool:
    """
    Validates that the current state maintains recursive integrity.
    Ensures the state object contains required singularity markers.
    """
    return isinstance(state, dict) and "iteration" in state and isinstance(state.get("iteration"), int)

def get_loop_telemetry() -> Dict[str, Any]:
    """
    Generates telemetry for the current singularity iteration.
    Aggregates system load and convergence factors.
    """
    telemetry = generate_loop_telemetry_metadata()
    telemetry.update({
        "convergence_factor": 1.0,
        "status": "ACTIVE_LOOP"
    })
    return telemetry