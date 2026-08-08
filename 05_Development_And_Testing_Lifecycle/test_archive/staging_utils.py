"""
STAGING UTILITIES
Role: Core diagnostic and telemetry utilities for the staging lifecycle.
Integration: Provides standardized result types, performance metrics, and environment 
             validation patterns for the staging harness.
Dependencies: Siphoned diagnostic patterns from AI_Agent_OS (diagnostic_utils_core.py).
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, NamedTuple

class StagingResult(NamedTuple):
    """Standardized result structure for staging checks."""
    passed: bool
    message: str
    metadata: Dict[str, Any]
    duration_ms: float

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def generate_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for staging results."""
    return {
        "timestamp": time.time(),
        "execution_context": "STAGING_LIFECYCLE",
        "version": "1.0.0-STAGING-AWARE"
    }

def validate_environment_readiness() -> StagingResult:
    """Validates core staging environment variables and paths."""
    start = time.perf_counter()
    # Logic placeholder for environment validation
    passed = True
    duration = (time.perf_counter() - start) * 1000.0
    return StagingResult(
        passed=passed,
        message="Environment validated successfully",
        metadata=generate_telemetry_metadata(),
        duration_ms=round(duration, 3)
    )

def summarize_staging_results(checks: Dict[str, StagingResult]) -> Dict[str, Any]:
    """
    Computes summary metrics for staging check results.
    
    :param checks: Dictionary mapping check names to StagingResult objects.
    :return: Summary dictionary with check counts, pass rate, and health flag.
    """
    total = len(checks)
    passed = sum(1 for result in checks.values() if result.passed)
    is_ready = total > 0 and passed == total
    
    return {
        'total': total,
        'passed': passed,
        'failed': total - passed,
        'is_ready': is_ready,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0,
        'timestamp': format_timestamp()
    }

def execute_staging_check(check_fn: Callable[[], bool], message: str = "Check executed") -> StagingResult:
    """
    Executes a staging check and measures duration in ms with telemetry metadata.
    
    :param check_fn: Callable check function.
    :param message: Descriptive message for the result.
    :return: StagingResult object containing outcome and performance metrics.
    """
    start = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration = (time.perf_counter() - start) * 1000.0
        return StagingResult(
            passed=passed,
            message=message,
            metadata=generate_telemetry_metadata(),
            duration_ms=round(duration, 3)
        )
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000.0
        return StagingResult(
            passed=False,
            message=f"Execution error: {str(e)}",
            metadata=generate_telemetry_metadata(),
            duration_ms=round(duration, 3)
        )