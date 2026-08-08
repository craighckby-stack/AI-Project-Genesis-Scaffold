"""
DIAGNOSTIC REGISTRY UTILITIES
Role: Provides standardized diagnostic telemetry, validation helpers, and structured result schemas 
      for the concept registry.
Integration: Used by concept_registry_utils.py and diagnostic_registry.py for audit-ready 
             integrity checks and performance monitoring.
"""

from __future__ import annotations
import time
import threading
from typing import Dict, Any, Tuple, Callable, Optional
from .diagnostic_types import RegistryDiagnosticResult

def execute_diagnostic_check(
    check_fn: Callable[[], bool], 
    name: str, 
    context: Optional[Dict[str, Any]] = None
) -> RegistryDiagnosticResult:
    """
    Executes a diagnostic check with precise duration measurement and structured result reporting.
    
    :param check_fn: The logic to execute.
    :param name: Identifier for the diagnostic check.
    :param context: Optional metadata to include in the result.
    :return: A structured RegistryDiagnosticResult.
    """
    start_time = time.perf_counter()
    metadata = context or {}
    metadata.update({
        "check_name": name,
        "thread_id": threading.get_ident()
    })
    
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return RegistryDiagnosticResult(
            passed=passed,
            message="Check completed successfully" if passed else "Check failed validation",
            duration_ms=round(duration_ms, 3),
            metadata=metadata
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return RegistryDiagnosticResult(
            passed=False,
            message=f"Exception during execution: {str(e)}",
            duration_ms=round(duration_ms, 3),
            metadata=metadata
        )

def generate_registry_telemetry(count: int, status: str = "OPERATIONAL") -> Dict[str, Any]:
    """
    Generates standard telemetry metadata for registry audits.
    
    :param count: Number of items currently in the registry.
    :param status: Current operational status of the registry.
    :return: Dictionary containing telemetry metrics.
    """
    return {
        "timestamp": time.time(),
        "item_count": count,
        "status": status,
        "version": "1.2.0-DIAGNOSTIC-AWARE",
        "system_load_factor": 0.0 # Placeholder for future load-balancing metrics
    }

def summarize_registry_health(results: list[RegistryDiagnosticResult]) -> Dict[str, Any]:
    """
    Computes summary metrics for a batch of diagnostic results.
    
    :param results: List of RegistryDiagnosticResult objects.
    :return: Summary dictionary.
    """
    total = len(results)
    passed = sum(1 for r in results if r.passed)
    return {
        "total_checks": total,
        "passed_checks": passed,
        "failed_checks": total - passed,
        "is_healthy": total > 0 and passed == total,
        "pass_rate": round((passed / total * 100), 2) if total > 0 else 0.0
    }