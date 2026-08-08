"""
DIAGNOSTIC UTILITIES CORE
Role: Core logic for diagnostic validation, telemetry generation, and type definitions.
Integration: Provides the foundational diagnostic primitives for the test_archive lifecycle.
Siphoned Patterns: AI_Agent_OS (Tessera Enterprise Diagnostic Engine)
"""

from __future__ import annotations
import time
import uuid
from typing import NamedTuple, Any, Dict, Callable, Optional

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]
    duration_ms: float

class DiagnosticReport(NamedTuple):
    report_id: str
    timestamp: float
    results: Dict[str, DiagnosticResult]
    is_healthy: bool

def validate_check_function(func: Callable) -> bool:
    """Validates that a check function is callable."""
    return callable(func)

def generate_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for diagnostic results."""
    return {
        "timestamp": time.time(),
        "execution_id": str(uuid.uuid4()),
        "version": "1.0.0-TEST-ARCHIVE-CORE",
        "runtime_env": "DIAGNOSTIC-AWARE"
    }

def execute_diagnostic_check(
    name: str, 
    check_fn: Callable[[], DiagnosticResult]
) -> DiagnosticResult:
    """
    Executes a diagnostic check with precise timing and error handling.
    
    :param name: Name of the diagnostic check.
    :param check_fn: Callable returning a DiagnosticResult.
    :return: DiagnosticResult with updated duration.
    """
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticResult(
            passed=result.passed,
            message=result.message,
            metadata={**result.metadata, "check_name": name},
            duration_ms=round(duration, 3)
        )
    except Exception as e:
        duration = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticResult(
            passed=False,
            message=f"Execution error: {str(e)}",
            metadata={"check_name": name, "error": True},
            duration_ms=round(duration, 3)
        )

def aggregate_diagnostic_results(results: Dict[str, DiagnosticResult]) -> DiagnosticReport:
    """
    Aggregates multiple diagnostic results into a single report.
    """
    is_healthy = all(r.passed for r in results.values())
    return DiagnosticReport(
        report_id=str(uuid.uuid4()),
        timestamp=time.time(),
        results=results,
        is_healthy=is_healthy
    )