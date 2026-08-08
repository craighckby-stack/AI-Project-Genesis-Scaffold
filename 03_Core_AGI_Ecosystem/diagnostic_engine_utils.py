"""
DIAGNOSTIC ENGINE UTILITIES
Role: Helper utilities for diagnostic execution formatting, status telemetry, and metric computation.
Integration: Imported by agi_ecosystem_diagnostics.py to compute diagnostic metrics cleanly.
Siphoned from: AI_Agent_OS architecture.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")

def summarize_diagnostic_results(checks: Dict[str, bool]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    
    :param checks: Dictionary mapping check names to boolean results.
    :return: Summary dictionary with check counts, pass rate, and health flag.
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

def execute_check_with_telemetry(check_fn: Callable[[], bool], check_name: str) -> Tuple[bool, float]:
    """
    Executes a diagnostic check and measures execution duration in milliseconds.
    
    :param check_fn: Callable check function.
    :param check_name: Identifier string for the check.
    :return: Tuple of (check_passed, duration_ms).
    """
    start_time = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception as e:
        # Log error here if a logger was available, but for now return False
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return False, round(duration_ms, 3)
