"""
EULER ENGINE UTILITIES
Role: Helper utilities for mathematical state evolution, convergence tracking, and theorem validation.
Integration: Imported by euler_engine.py to compute mathematical metrics and state transitions.
Upgraded to support structured telemetry and diagnostic validation.
"""

from __future__ import annotations
import time
import math
from typing import Dict, Any, Tuple, Callable
from .euler_engine_diagnostics import (
    EulerDiagnosticResult, 
    validate_evolution_function, 
    generate_euler_telemetry
)

def compute_convergence_delta(current: float, previous: float) -> float:
    """Computes the delta between two mathematical states for convergence tracking."""
    return abs(current - previous)

def validate_theorem_integrity(theorem_data: Dict[str, Any]) -> bool:
    """Validates the structural integrity of a mathematical theorem object."""
    required_keys = {'id', 'formula', 'confidence'}
    return all(key in theorem_data for key in required_keys)

def execute_math_evolution_step(step_fn: Callable[[], float]) -> Tuple[float, float, Dict[str, Any]]:
    """
    Executes a mathematical evolution step and measures execution duration with telemetry.
    
    :param step_fn: Callable evolution function.
    :return: Tuple of (result, duration_ms, telemetry_metadata).
    """
    if not validate_evolution_function(step_fn):
        return 0.0, 0.0, {"error": "Invalid evolution function provided"}

    start_time = time.perf_counter()
    try:
        result = step_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        telemetry = generate_euler_telemetry()
        return float(result), round(duration_ms, 3), telemetry
    except Exception as e:
        return 0.0, 0.0, {"error": str(e)}

def summarize_evolution_metrics(results: list[float]) -> Dict[str, Any]:
    """
    Computes summary metrics for a sequence of evolution results.
    
    :param results: List of float values from evolution steps.
    :return: Summary dictionary with statistical analysis.
    """
    if not results:
        return {"count": 0, "mean": 0.0, "variance": 0.0}
    
    count = len(results)
    mean = sum(results) / count
    variance = sum((x - mean) ** 2 for x in results) / count
    
    return {
        "count": count,
        "mean": round(mean, 6),
        "variance": round(variance, 6),
        "is_stable": variance < 0.001
    }