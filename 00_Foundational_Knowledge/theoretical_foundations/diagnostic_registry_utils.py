"""
DIAGNOSTIC REGISTRY UTILITIES
Role: Helper utilities for concept registry telemetry, validation, and diagnostic reporting.
Integration: Imported by concept_registry_utils.py to provide audit-ready diagnostic hooks.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Tuple, Callable

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp."""
    import datetime
    return datetime.datetime.utcnow().isoformat() + 'Z'

def execute_diagnostic_check(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a diagnostic check and measures execution duration in milliseconds."""
    start_time = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception:
        return False, 0.0

def generate_registry_telemetry(total: int) -> Dict[str, Any]:
    """Generates standard telemetry metadata for registry operations."""
    return {
        "timestamp": format_timestamp(),
        "total_concepts": total,
        "version": "1.1.0-DIAGNOSTIC-AWARE"
    }
