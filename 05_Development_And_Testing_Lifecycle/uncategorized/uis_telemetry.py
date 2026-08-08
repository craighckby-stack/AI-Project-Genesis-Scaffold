"""
UI TELEMETRY UTILITIES
Role: Helper utilities for UI diagnostic execution formatting, status telemetry, and metric computation.
Integration: Imported by uis.py to compute UI diagnostic metrics cleanly.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable

def format_ui_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_ui_results(checks: Dict[str, bool]) -> Dict[str, Any]:
    """
    Computes summary metrics for UI diagnostic check results.
    """
    total_checks = len(checks)
    passed_checks = sum(1 for status in checks.values() if status)
    failed_checks = total_checks - passed_checks
    is_healthy = total_checks > 0 and failed_checks == 0

    return {
        'total': total_checks,
        'passed': passed_checks,
        'failed': failed_checks,
        'is_healthy': is_healthy,
        'pass_rate': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0
    }

def execute_ui_check_with_telemetry(check_fn: Callable[[], bool], check_type: str) -> Tuple[bool, float]:
    """
    Executes a UI diagnostic check and measures execution duration in milliseconds.
    """
    start_time = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return False, round(duration_ms, 3)