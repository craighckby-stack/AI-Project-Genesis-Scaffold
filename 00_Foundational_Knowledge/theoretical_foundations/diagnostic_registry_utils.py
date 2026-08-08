"""
DIAGNOSTIC REGISTRY UTILITIES
Role: Provides standardized diagnostic telemetry and validation helpers for the concept registry.
Integration: Used by concept_registry_utils.py for audit-ready integrity checks.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Tuple, Callable

def execute_diagnostic_check(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a diagnostic check with precise duration measurement."""
    start_time = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception:
        return False, round((time.perf_counter() - start_time) * 1000.0, 3)

def generate_registry_telemetry(count: int) -> Dict[str, Any]:
    """Generates standard telemetry metadata for registry audits."""
    return {
        "timestamp": time.time(),
        "item_count": count,
        "version": "1.1.0-DIAGNOSTIC-AWARE"
    }
