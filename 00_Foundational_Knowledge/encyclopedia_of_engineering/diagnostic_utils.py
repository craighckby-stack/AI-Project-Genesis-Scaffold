"""
DIAGNOSTIC UTILITIES
Role: Helper utilities for diagnostic execution formatting, status telemetry, and metric computation.
Integration: Imported by diagnostic_engine.py to compute diagnostic metrics cleanly.
This module serves as the foundational utility layer for the system's diagnostic harness,
providing standardized formatting and telemetry computation logic.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, Optional
from .diagnostic_utils_core import DiagnosticResult, generate_telemetry_metadata

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_diagnostic_results(checks: Dict[str, DiagnosticResult]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    
    :param checks: Dictionary mapping check names to DiagnosticResult objects.
    :return: Summary dictionary with check counts, pass rate, and health flag.
    """
    total_checks = len(checks)
    passed_checks = sum(1 for res in checks.values() if res.passed)
    failed_checks = total_checks - passed_checks
    is_healthy = total_checks > 0 and failed_checks == 0

    return {
        'total': total_checks,
        'passed': passed_checks,
        'failed': failed_checks,
        'is_healthy': is_healthy,
        'pass_rate': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0
    }

def execute_check_with_telemetry(
    check_fn: Callable[[], DiagnosticResult], 
    check_type: str
) -> Tuple[DiagnosticResult, float]:
    """
    Executes a diagnostic check and measures execution duration in milliseconds.
    
    :param check_fn: Callable check function returning a DiagnosticResult.
    :param check_type: Identifier string for the check.
    :return: Tuple of (DiagnosticResult, duration_ms).
    """
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return result, round(duration_ms, 3)
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        error_result = DiagnosticResult(
            passed=False,
            message=f"Execution error in {check_type}: {str(e)}",
            metadata=generate_telemetry_metadata()
        )
        return error_result, round(duration_ms, 3)