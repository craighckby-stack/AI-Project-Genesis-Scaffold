"""
DIAGNOSTIC UTILITIES
Role: Helper utilities for diagnostic execution formatting, status telemetry, and metric computation.
Integration: Imported by diagnostic_engine.py to compute diagnostic metrics cleanly.
Architectural Note: Siphoned from AI_Agent_OS diagnostic patterns to ensure robust telemetry.
"""

from __future__ import annotations
import time
import platform
import os
import datetime
from typing import Dict, Any, Callable, Tuple
from .diagnostic_types import DiagnosticCheckResult

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_diagnostic_results(checks: Dict[str, DiagnosticCheckResult]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    
    :param checks: Dictionary mapping check names to DiagnosticCheckResult objects.
    :return: Summary dictionary with check counts, pass rate, and health flag.
    """
    total_checks = len(checks)
    passed_checks = sum(1 for data in checks.values() if data.passed)
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
    """
    Generates standard telemetry metadata for diagnostic reports.
    """
    return {
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "process_id": os.getpid(),
        "uptime": time.process_time(),
        "node_arch": platform.machine()
    }

def execute_check_with_telemetry(check_fn: Callable[[], Dict[str, Any]], check_name: str) -> DiagnosticCheckResult:
    """
    Executes a diagnostic check and measures execution duration in milliseconds.
    
    :param check_fn: Callable check function returning a dict with 'passed' and 'message'.
    :param check_name: Identifier string for the check.
    :return: DiagnosticCheckResult object.
    """
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticCheckResult(
            passed=bool(result.get('passed', False)),
            duration_ms=round(duration_ms, 3),
            message=result.get('message', 'Check completed'),
            metadata=result.get('metadata', {})
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticCheckResult(
            passed=False,
            duration_ms=round(duration_ms, 3),
            message=f"Execution error: {str(e)}",
            metadata={'error': True}
        )