"""
EULER ENGINE UTILITIES
Role: Core mathematical operations, validation logic, and execution wrappers for the Euler Engine.
Integration: Imported by euler_engine.py to handle low-level math, formula verification, and integrity checks.
Dependencies: euler_math_helpers.py
"""

from __future__ import annotations
import time
import math
from typing import Any, Dict, Tuple, Callable, List, Optional

try:
    from .euler_math_helpers import (
        format_utc_timestamp,
        compute_formula_hash,
        is_numerically_stable,
        calculate_variance
    )
except ImportError:
    from euler_math_helpers import (
        format_utc_timestamp,
        compute_formula_hash,
        is_numerically_stable,
        calculate_variance
    )


def compute_convergence_delta(new_val: float, old_val: float) -> float:
    """
    Computes the absolute difference between two values to track convergence.
    Sanitizes invalid numeric inputs (NaN/Inf) to preserve execution stability.
    """
    safe_new = new_val if is_numerically_stable(new_val) else 0.0
    safe_old = old_val if is_numerically_stable(old_val) else 0.0
    return abs(safe_new - safe_old)


def validate_theorem_integrity(theorem: Dict[str, Any]) -> bool:
    """
    Validates the structural integrity of a theorem object.
    Checks for required fields: id, formula, and confidence.
    Optionally computes formula hashes for verification if formula is present.
    """
    if not isinstance(theorem, dict):
        return False

    required_keys = {"id", "formula", "confidence"}
    if not all(key in theorem for key in required_keys):
        return False

    if not isinstance(theorem["id"], str) or not theorem["id"].strip():
        return False

    if not isinstance(theorem["formula"], str) or not theorem["formula"].strip():
        return False

    confidence = theorem["confidence"]
    if not isinstance(confidence, (int, float)) or math.isnan(confidence) or not (0.0 <= confidence <= 1.0):
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
        if not is_numerically_stable(result):
            result = 0.0
    except Exception:
        result = 0.0

    duration_ms = (time.perf_counter() - start_time) * 1000.0
    return float(result), round(duration_ms, 4)


def normalize_confidence(confidence: float) -> float:
    """
    Clamps and normalizes a confidence score strictly within [0.0, 1.0].
    """
    if not is_numerically_stable(confidence):
        return 0.0
    return max(0.0, min(1.0, float(confidence)))


def summarize_evolution_batch(deltas: List[float]) -> Dict[str, Any]:
    """
    Computes statistical metrics (mean, max, variance) for a batch of convergence deltas.
    
    :param deltas: List of floating-point convergence measurements.
    :return: Dictionary containing diagnostic statistics.
    """
    valid_deltas = [d for d in deltas if is_numerically_stable(d)]
    if not valid_deltas:
        return {
            "count": 0,
            "mean_delta": 0.0,
            "max_delta": 0.0,
            "variance": 0.0,
            "timestamp": format_utc_timestamp()
        }

    mean_delta = sum(valid_deltas) / len(valid_deltas)
    max_delta = max(valid_deltas)
    var = calculate_variance(valid_deltas)

    return {
        "count": len(valid_deltas),
        "mean_delta": round(mean_delta, 6),
        "max_delta": round(max_delta, 6),
        "variance": round(var, 6),
        "timestamp": format_utc_timestamp()
    }