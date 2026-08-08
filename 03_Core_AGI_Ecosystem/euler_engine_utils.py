"""
EULER ENGINE UTILITIES
Role: Core mathematical operations, validation logic, and execution wrappers for the Euler Engine.
Integration: Imported by euler_engine.py to handle low-level math and integrity checks.
"""

from __future__ import annotations
import time
import math
from typing import Any, Dict, Tuple, Callable

def compute_convergence_delta(new_val: float, old_val: float) -> float:
    """Computes the absolute difference between two values to track convergence."""
    return abs(new_val - old_val)

def validate_theorem_integrity(theorem: Dict[str, Any]) -> bool:
    """
    Validates the structural integrity of a theorem object.
    Checks for required fields: id, formula, and confidence.
    """
    required_keys = {"id", "formula", "confidence"}
    if not all(key in theorem for key in required_keys):
        return False
    
    if not isinstance(theorem["id"], str) or not theorem["id"]:
        return False
    
    if not isinstance(theorem["confidence"], (int, float)) or not (0 <= theorem["confidence"] <= 1):
        return False
        
    return True

def execute_math_evolution_step(evolution_fn: Callable[[], float]) -> Tuple[float, float]:
    """
    Executes a mathematical evolution function and measures its duration.
    
    :param evolution_fn: A callable that returns a float result.
    :return: A tuple of (result, duration_ms).
    """
    start_time = time.perf_counter()
    try:
        result = evolution_fn()
        # Ensure result is a valid float (not NaN or Inf)
        if math.isnan(result) or math.isinf(result):
            result = 0.0
    except Exception:
        result = 0.0
    
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    return float(result), round(duration_ms, 4)
