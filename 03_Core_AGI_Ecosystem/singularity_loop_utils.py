"""
SINGULARITY LOOP UTILITIES
Role: Helper utilities for recursive convergence, state delta computation, and loop telemetry.
Integration: Imported by singularity_loop.py to compute convergence metrics cleanly.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable

def compute_convergence_delta(current_state: Dict[str, Any], previous_state: Dict[str, Any]) -> float:
    """Calculates the delta between two states to measure convergence progress."""
    # Simplified delta logic for demonstration
    return abs(len(str(current_state)) - len(str(previous_state)))

def validate_loop_integrity(state: Dict[str, Any]) -> bool:
    """Validates that the current state maintains recursive integrity."""
    return isinstance(state, dict) and "iteration" in state

def get_loop_telemetry() -> Dict[str, Any]:
    """Generates telemetry for the current singularity iteration."""
    return {
        "loop_start_time": time.time(),
        "system_load": 0.05,
        "convergence_factor": 1.0
    }