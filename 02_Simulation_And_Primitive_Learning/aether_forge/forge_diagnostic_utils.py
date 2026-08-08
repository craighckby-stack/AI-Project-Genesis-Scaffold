"""
FORGE DIAGNOSTIC UTILITIES
Role: Helper utilities for diagnostic execution, telemetry formatting, and metric computation.
Integration: Imported by forge_diagnostics.py to compute diagnostic metrics cleanly.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_diagnostic_results(results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    """
    total = len(results)
    passed = sum(1 for r in results.values() if r.passed)
    return {
        'total': total,
        'passed': passed,
        'failed': total - passed,
        'is_healthy': total > 0 and passed == total,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def execute_with_telemetry(check_fn: Callable[[], Any]) -> Tuple[Any, float]:
    """Executes a diagnostic check and measures execution duration in ms."""
    start = time.perf_counter()
    result = check_fn()
    duration = (time.perf_counter() - start) * 1000.0
    return result, round(duration, 3)
