"""
FORGE DIAGNOSTIC UTILITIES
Role: Helper utilities for diagnostic execution, telemetry formatting, and metric computation.
Integration: Imported by forge_diagnostics.py to compute diagnostic metrics cleanly.
Architectural Alignment: Siphoned from AI_Agent_OS diagnostic-engine patterns.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, NamedTuple

class DiagnosticResult(NamedTuple):
    """Standardized result container for individual diagnostic checks."""
    passed: bool
    message: str
    metadata: Dict[str, Any]

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def generate_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for diagnostic results."""
    return {
        "timestamp": time.time(),
        "thread_id": id(time.time()),
        "version": "1.0.0-FORGE-DIAGNOSTIC-AWARE"
    }

def summarize_diagnostic_results(results: Dict[str, DiagnosticResult]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    
    :param results: Dictionary mapping check names to DiagnosticResult objects.
    :return: Summary dictionary with check counts, pass rate, and health flag.
    """
    total = len(results)
    passed = sum(1 for r in results.values() if r.passed)
    failed = total - passed
    
    return {
        'total': total,
        'passed': passed,
        'failed': failed,
        'is_healthy': total > 0 and passed == total,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0,
        'generated_at': format_timestamp()
    }

def execute_with_telemetry(check_fn: Callable[[], DiagnosticResult]) -> Tuple[DiagnosticResult, float]:
    """
    Executes a diagnostic check and measures execution duration in milliseconds.
    
    :param check_fn: Callable returning a DiagnosticResult.
    :return: Tuple of (DiagnosticResult, duration_ms).
    """
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return result, round(duration_ms, 3)
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticResult(
            passed=False,
            message=f"Execution Exception: {str(e)}",
            metadata={"error_type": type(e).__name__}
        ), round(duration_ms, 3)

def validate_check_function(func: Callable) -> bool:
    """Validates that a check function is callable."""
    return callable(func)