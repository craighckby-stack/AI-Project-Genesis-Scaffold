"""
WORLD SIMULATION UTILITIES
Role: Helper utilities for simulation state management, environment telemetry, and metric computation.
Integration: Imported by world_simulation_platform.py to compute simulation metrics cleanly.
"""

from __future__ import annotations
import time
import uuid
from typing import Dict, Any, Tuple, Callable

def generate_simulation_id() -> str:
    """Generates a unique simulation session identifier."""
    return f"sim_{uuid.uuid4().hex[:8]}"

def compute_simulation_health(metrics: Dict[str, float]) -> bool:
    """Determines if the simulation environment is within acceptable parameters."""
    return metrics.get("stability", 0.0) > 0.85

def execute_step_with_telemetry(step_fn: Callable[[], Any]) -> Tuple[bool, float, Any]:
    """
    Executes a simulation step and measures execution duration in milliseconds.
    """
    start_time = time.perf_counter()
    try:
        result = step_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return True, round(duration_ms, 3), result
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return False, round(duration_ms, 3), str(e)
