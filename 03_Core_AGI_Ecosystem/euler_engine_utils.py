"""
EULER ENGINE UTILITIES
Role: Helper utilities for mathematical state evolution, convergence tracking, and theorem validation.
Integration: Imported by euler_engine.py to compute mathematical metrics and state transitions.
"""

from __future__ import annotations
import time
import math
from typing import Dict, Any, Tuple, Callable

def compute_convergence_delta(current: float, previous: float) -> float:
    """Computes the delta between two mathematical states for convergence tracking."""
    return abs(current - previous)

def validate_theorem_integrity(theorem_data: Dict[str, Any]) -> bool:
    """Validates the structural integrity of a mathematical theorem object."""
    required_keys = {'id', 'formula', 'confidence'}
    return all(key in theorem_data for key in required_keys)

def execute_math_evolution_step(step_fn: Callable[[], float]) -> Tuple[float, float]:
    """Executes a mathematical evolution step and measures execution duration."""
    start_time = time.perf_counter()
    try:
        result = step_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return result, round(duration_ms, 3)
    except Exception:
        return 0.0, 0.0
