"""
UTILITIES TELEMETRY
Role: Core diagnostic telemetry and execution harness for the test_archive lifecycle.
Integration: Provides structured result reporting and performance tracking for system diagnostics.
Dependencies: telemetry_core.py
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, Optional
from .telemetry_core import DiagnosticResult, generate_telemetry_metadata

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_results(checks: Dict[str, DiagnosticResult]) -> Dict[str, Any]:
    """
    Computes summary metrics for diagnostic check results.
    
    :param checks: Dictionary mapping check names to DiagnosticResult objects.
    :return: Summary dictionary with check counts, pass rate, and health flag.
    """
    total = len(checks)
    passed = sum(1 for res in checks.values() if res.passed)
    failed = total - passed
    
    return {
        'total': total,
        'passed': passed,
        'failed': failed,
        'is_healthy': total > 0 and failed == 0,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0,
        'generated_at': format_timestamp()
    }

def execute_with_telemetry(
    check_fn: Callable[[], bool], 
    context_name: str
) -> Tuple[DiagnosticResult, float]:
    """
    Executes a diagnostic check and measures execution duration in milliseconds.
    
    :param check_fn: Callable check function.
    :param context_name: Identifier for the check context.
    :return: Tuple of (DiagnosticResult, duration_ms).
    """
    start = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start) * 1000.0
        result = DiagnosticResult(
            passed=passed,
            message=f"Check '{context_name}' completed successfully.",
            metadata={**generate_telemetry_metadata(), "context": context_name}
        )
        return result, round(duration_ms, 3)
    except Exception as e:
        duration_ms = (time.perf_counter() - start) * 1000.0
        result = DiagnosticResult(
            passed=False,
            message=f"Check '{context_name}' failed with error: {str(e)}",
            metadata={**generate_telemetry_metadata(), "context": context_name, "error": str(e)}
        )
        return result, round(duration_ms, 3)

def run_diagnostic_suite(suite: Dict[str, Callable[[], bool]]) -> Dict[str, Any]:
    """
    Runs a suite of diagnostic checks and returns a comprehensive report.
    """
    results: Dict[str, DiagnosticResult] = {}
    durations: Dict[str, float] = {}
    
    for name, func in suite.items():
        res, dur = execute_with_telemetry(func, name)
        results[name] = res
        durations[name] = dur
        
    return {
        "summary": summarize_results(results),
        "details": {name: {"passed": res.passed, "duration_ms": durations[name]} for name, res in results.items()}
    }