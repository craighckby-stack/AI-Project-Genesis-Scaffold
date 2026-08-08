"""
DIAGNOSTIC UTILITIES
Role: Helper utilities for diagnostic execution formatting, status telemetry, and metric computation.
Integration: Imported by diagnostic_registry.py to compute diagnostic metrics cleanly.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, NamedTuple

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    duration_ms: float
    metadata: Dict[str, Any]

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_diagnostic_results(checks: Dict[str, DiagnosticResult]) -> Dict[str, Any]:
    """Computes summary metrics for diagnostic check results."""
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

def execute_check_with_telemetry(check_fn: Callable[[], Tuple[bool, str]], check_type: str) -> DiagnosticResult:
    """Executes a diagnostic check and measures execution duration in milliseconds."""
    start_time = time.perf_counter()
    try:
        passed, message = check_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticResult(passed, message, round(duration_ms, 3), {"type": check_type})
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticResult(False, str(e), round(duration_ms, 3), {"type": check_type, "error": True})
