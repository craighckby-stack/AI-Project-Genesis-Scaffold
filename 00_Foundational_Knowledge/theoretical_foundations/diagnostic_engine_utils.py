"""
DIAGNOSTIC ENGINE UTILITIES
Role: Helper utilities for diagnostic execution formatting, status telemetry, and metric computation.
Integration: Imported by diagnostic engines to compute diagnostic metrics and wrap execution logic.
"""

from __future__ import annotations
import datetime
import time
from typing import Dict, Any, Tuple, Callable
from .diagnostic_utils_core import DiagnosticResult, generate_telemetry_metadata

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_diagnostic_results(checks: Dict[str, DiagnosticResult | Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    
    :param checks: Dictionary mapping check names to result objects or dicts.
    :return: Summary dictionary with check counts, pass rate, and health flag.
    """
    total_checks = len(checks)
    # Handle both NamedTuple and Dict result structures
    passed_checks = sum(
        1 for res in checks.values() 
        if (res.passed if hasattr(res, 'passed') else res.get('passed', False))
    )
    failed_checks = total_checks - passed_checks
    is_healthy = total_checks > 0 and failed_checks == 0

    return {
        'total': total_checks,
        'passed': passed_checks,
        'failed': failed_checks,
        'is_healthy': is_healthy,
        'pass_rate': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0
    }

def execute_check_with_telemetry(check_fn: Callable[[], DiagnosticResult], check_type: str) -> Tuple[DiagnosticResult, float]:
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
            message=f"Execution failed: {str(e)}",
            metadata={"error": str(e), **generate_telemetry_metadata()}
        )
        return error_result, round(duration_ms, 3)