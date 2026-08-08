"""
ARCHITECT REGISTRY UTILITIES
Role: Helper utilities for diagnostic execution, telemetry formatting, and metric computation.
Integration: Imported by architect_registry.py to compute diagnostic metrics cleanly.
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
    passed = sum(1 for r in results.values() if r.get('passed', False))
    failed = total - passed
    
    return {
        'total': total,
        'passed': passed,
        'failed': failed,
        'is_healthy': total > 0 and failed == 0,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def execute_check_with_telemetry(validator: Callable[[], bool]) -> Tuple[bool, float]:
    """
    Executes a diagnostic check and measures execution duration in milliseconds.
    """
    start_time = time.perf_counter()
    try:
        passed = bool(validator())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception:
        return False, round((time.perf_counter() - start_time) * 1000.0, 3)
