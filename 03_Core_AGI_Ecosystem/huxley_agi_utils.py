"""
HUXLEY AGI UTILITIES
Role: Helper utilities for cognitive state management, evolution metrics, and self-awareness telemetry.
Integration: Imported by huxley_agi.py to compute AGI evolution metrics cleanly.
"""

from __future__ import annotations
import time
import uuid
from typing import Dict, Any, Tuple, Callable

def generate_cognitive_id() -> str:
    """Generates a unique identifier for a cognitive state snapshot."""
    return f"huxley-cog-{uuid.uuid4().hex[:8]}"

def compute_evolution_delta(current_state: Dict[str, Any], previous_state: Dict[str, Any]) -> float:
    """Computes the delta between two cognitive states to measure evolution progress."""
    # Simplified heuristic for evolution tracking
    return float(len(str(current_state)) - len(str(previous_state)))

def execute_cognitive_check(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a cognitive integrity check with telemetry."""
    start_time = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception:
        return False, 0.0
