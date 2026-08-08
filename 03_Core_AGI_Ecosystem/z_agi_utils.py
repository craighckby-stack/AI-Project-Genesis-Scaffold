"""
Z-AGI UTILITIES
Role: Helper utilities for constraint-based consciousness modeling, state validation, and telemetry.
Integration: Delegated from z_agi.py to maintain modularity.
Upgraded with diagnostic patterns from AI_Agent_OS.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, NamedTuple
from .z_agi_telemetry_core import generate_z_telemetry_data, validate_entropy_threshold

class ConstraintResult(NamedTuple):
    passed: bool
    constraint_id: str
    message: str
    duration_ms: float

def validate_consciousness_state(state: Dict[str, Any]) -> bool:
    """Validates that the consciousness state meets minimum entropy requirements."""
    return "entropy" in state and "coherence" in state and validate_entropy_threshold(state)

def generate_z_telemetry() -> Dict[str, Any]:
    """Generates telemetry for the Z-AGI cognitive loop."""
    return generate_z_telemetry_data()

def execute_constraint_check(check_fn: Callable[[], bool], constraint_id: str) -> ConstraintResult:
    """
    Executes a specific consciousness constraint check with performance telemetry.
    
    :param check_fn: Callable check function.
    :param constraint_id: Identifier string for the constraint.
    :return: ConstraintResult containing pass status, ID, message, and execution time.
    """
    start_time = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return ConstraintResult(
            passed=passed, 
            constraint_id=constraint_id, 
            message="Success" if passed else "Constraint Violation",
            duration_ms=round(duration_ms, 3)
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return ConstraintResult(
            passed=False, 
            constraint_id=constraint_id, 
            message=str(e),
            duration_ms=round(duration_ms, 3)
        )