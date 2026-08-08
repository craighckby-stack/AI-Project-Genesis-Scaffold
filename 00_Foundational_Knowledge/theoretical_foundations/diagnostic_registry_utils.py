"""
DIAGNOSTIC REGISTRY UTILITIES
Role: Provides telemetry and diagnostic helpers for the ConceptRegistry.
Integration: Used by concept_registry_utils.py for integrity reporting.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple

def execute_diagnostic_check(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a diagnostic check and measures duration in ms."""
    start = time.perf_counter()
    try:
        passed = check_fn()
        duration = (time.perf_counter() - start) * 1000.0
        return passed, round(duration, 3)
    except Exception:
        return False, round((time.perf_counter() - start) * 1000.0, 3)

def generate_registry_telemetry(count: int) -> Dict[str, Any]:
    """Generates standard telemetry metadata for registry audits."""
    return {
        "timestamp": time.time(),
        "item_count": count,
        "system_version": "1.1.0-DIAGNOSTIC-AWARE"
    }