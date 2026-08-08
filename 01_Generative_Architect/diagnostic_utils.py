"""
DIAGNOSTIC UTILITIES
Role: Core diagnostic engine for the Generative Architect system.
Integration: Provides telemetry, health monitoring, and structured reporting 
             for system integrity validation.
"""

from __future__ import annotations
import time
import datetime
from typing import NamedTuple, Any, Dict, Callable, Tuple, Optional

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

class DiagnosticCheckResult(NamedTuple):
    passed: bool
    duration_ms: float
    message: str
    metadata: Dict[str, Any]

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def generate_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for diagnostic results."""
    return {
        "timestamp": time.time(),
        "version": "1.0.0-GENERATIVE-ARCHITECT",
        "system_clock": time.perf_counter()
    }

def summarize_diagnostic_results(checks: Dict[str, DiagnosticCheckResult]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    
    :param checks: Dictionary mapping check names to DiagnosticCheckResult objects.
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
) -> DiagnosticCheckResult:
    """
    Executes a diagnostic check and measures execution duration in milliseconds.
    
    :param check_fn: Callable returning a DiagnosticResult.
    :param check_type: Identifier string for the check.
    :return: DiagnosticCheckResult containing status and performance metrics.
    """
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticCheckResult(
            passed=result.passed,
            duration_ms=round(duration_ms, 3),
            message=result.message,
            metadata=result.metadata
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticCheckResult(
            passed=False,
            duration_ms=round(duration_ms, 3),
            message=f"Execution error: {str(e)}",
            metadata={"error_type": type(e).__name__}
        )