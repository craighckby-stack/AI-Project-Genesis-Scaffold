"""
DIAGNOSTIC REGISTRY UTILITIES
Role: Helper utilities for diagnostic execution, telemetry formatting, and result summarization.
Integration: Imported by diagnostic_registry.py to compute diagnostic metrics and handle metadata.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp."""
    import datetime
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_foundation_results(results: Dict[str, Any]) -> Dict[str, Any]:
    """Computes summary metrics for diagnostic results."""
    total = len(results)
    passed = sum(1 for r in results.values() if r.passed)
    return {
        'total': total,
        'passed': passed,
        'failed': total - passed,
        'is_healthy': total > 0 and passed == total,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def execute_with_telemetry(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a check and measures duration in ms."""
    start = time.perf_counter()
    try:
        passed = bool(check_fn())
    except Exception:
        passed = False
    duration = (time.perf_counter() - start) * 1000.0
    return passed, round(duration, 3)
