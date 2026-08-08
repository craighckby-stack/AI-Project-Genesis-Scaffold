"""
DIAGNOSTIC UTILITIES
Role: Core helper utilities for diagnostic execution, status telemetry, and metric computation.
Integration: Imported by diagnostic_engine.py to compute diagnostic metrics and system telemetry.
Architecture: Aligned with AI_Agent_OS diagnostic standards for enterprise-grade health monitoring.
"""

from __future__ import annotations
import time
import platform
import os
import datetime
from typing import Dict, Any, Callable, Tuple

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_diagnostic_results(checks: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    
    :param checks: Dictionary mapping check names to result objects containing 'passed' status.
    :return: Summary dictionary with check counts, pass rate, and health flag.
    """
    total_checks = len(checks)
    passed_checks = sum(1 for status in checks.values() if status.get('passed', False))
    failed_checks = total_checks - passed_checks
    is_healthy = total_checks > 0 and failed_checks == 0

    return {
        'total': total_checks,
        'passed': passed_checks,
        'failed': failed_checks,
        'is_healthy': is_healthy,
        'pass_rate': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0
    }

def generate_system_telemetry() -> Dict[str, Any]:
    """Generates standard system telemetry metadata for diagnostic reports."""
    return {
        "timestamp": format_timestamp(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "pid": os.getpid(),
        "node_id": platform.node(),
        "system_load": os.getloadavg() if hasattr(os, 'getloadavg') else None
    }

def execute_check_with_telemetry(check_fn: Callable[[], Dict[str, Any]], check_type: str) -> Tuple[Dict[str, Any], float]:
    """
    Executes a diagnostic check and measures execution duration in milliseconds.
    
    :param check_fn: Callable check function returning a result dictionary.
    :param check_type: Identifier string for the check.
    :return: Tuple of (result_dict, duration_ms).
    """
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return result, round(duration_ms, 3)
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return {
            "passed": False,
            "message": f"Diagnostic execution error: {str(e)}",
            "metadata": {"error_type": type(e).__name__}
        }, round(duration_ms, 3)