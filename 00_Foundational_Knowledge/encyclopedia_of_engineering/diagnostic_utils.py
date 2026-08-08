"""
================================================================================
SYSTEM DIAGNOSTIC UTILITIES
================================================================================
Role:
    Provides core utility functions for executing diagnostic checks, capturing
    telemetry, computing system health metrics, and formatting diagnostic reports.

System Integration:
    - Imported by `diagnostic_engine.py` to run and measure diagnostic checks.
    - Utilizes types and telemetry helpers from `diagnostic_utils_core.py`.
    - Integrates with the system's logging and monitoring pipelines to provide
      real-time health status.

Key Capabilities:
    - High-precision execution timing (telemetry).
    - Diagnostic result aggregation and summary statistics.
    - Resilient retry mechanisms with exponential backoff.
    - System health index computation.
================================================================================
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

def execute_check_with_retry(
    check_fn: Callable[[], DiagnosticResult],
    check_type: str,
    retries: int = 3,
    backoff_factor: float = 1.5
) -> Tuple[DiagnosticResult, float]:
    """
    Executes a diagnostic check with a retry mechanism and exponential backoff.
    
    :param check_fn: Callable check function returning a DiagnosticResult.
    :param check_type: Identifier string for the check.
    :param retries: Number of retries allowed.
    :param backoff_factor: Multiplier for backoff delay.
    :return: Tuple of (DiagnosticResult, total_duration_ms).
    """
    total_duration_ms = 0.0
    attempt = 0
    delay = 0.1

    while attempt <= retries:
        start_time = time.perf_counter()
        try:
            result = check_fn()
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            total_duration_ms += duration_ms
            
            if result.passed or attempt == retries:
                return result, round(total_duration_ms, 3)
                
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            total_duration_ms += duration_ms
            if attempt == retries:
                error_result = DiagnosticResult(
                    passed=False,
                    message=f"Execution error in {check_type} after {retries} retries: {str(e)}",
                    metadata={
                        **generate_telemetry_metadata(),
                        "attempts": attempt + 1,
                        "exception": type(e).__name__
                    }
                )
                return error_result, round(total_duration_ms, 3)
        
        attempt += 1
        time.sleep(delay)
        delay *= backoff_factor

    return DiagnosticResult(
        passed=False, 
        message="Unknown retry failure during diagnostic execution", 
        metadata=generate_telemetry_metadata()
    ), round(total_duration_ms, 3)

def compute_system_health_index(
    checks: Dict[str, DiagnosticResult],
    weights: Optional[Dict[str, float]] = None
) -> float:
    """
    Computes a weighted system health index between 0.0 and 100.0.
    If weights are not provided, all checks are weighted equally.
    
    :param checks: Dictionary mapping check names to DiagnosticResult objects.
    :param weights: Optional dictionary mapping check names to float weights.
    :return: Health index score (0.0 to 100.0).
    """
    if not checks:
        return 0.0

    total_weight = 0.0
    weighted_score = 0.0

    for name, result in checks.items():
        weight = weights.get(name, 1.0) if weights else 1.0
        total_weight += weight
        if result.passed:
            weighted_score += weight

    if total_weight == 0.0:
        return 0.0

    return round((weighted_score / total_weight) * 100.0, 2)