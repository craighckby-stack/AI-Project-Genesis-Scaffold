"""
DIAGNOSTIC REGISTRY UTILITIES
Role: Provides telemetry and diagnostic helpers for the ConceptRegistry.
Integration: Used by concept_registry_utils.py for integrity reporting.
Dependencies: diagnostic_registry_core.py
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple
from .diagnostic_registry_core import RegistryDiagnosticResult, get_system_context

def execute_diagnostic_check(check_fn: Callable[[], bool], label: str = "generic_check") -> Tuple[bool, float, str]:
    """
    Executes a diagnostic check and measures duration in ms.
    Returns (passed, duration_ms, message).
    """
    start = time.perf_counter()
    try:
        passed = check_fn()
        duration = (time.perf_counter() - start) * 1000.0
        return passed, round(duration, 3), f"Check '{label}' completed successfully."
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000.0
        return False, round(duration, 3), f"Check '{label}' failed with error: {str(e)}"

def generate_registry_telemetry(count: int) -> Dict[str, Any]:
    """
    Generates standard telemetry metadata for registry audits,
    integrating core system context.
    """
    telemetry = get_system_context()
    telemetry.update({
        "item_count": count,
        "audit_status": "COMPLETED"
    })
    return telemetry

def format_registry_report(results: Dict[str, RegistryDiagnosticResult]) -> Dict[str, Any]:
    """
    Aggregates individual check results into a structured registry report.
    """
    return {
        "summary": {
            "total": len(results),
            "passed": sum(1 for r in results.values() if r.passed),
            "failed": sum(1 for r in results.values() if not r.passed)
        },
        "details": {k: v._asdict() for k, v in results.items()},
        "context": get_system_context()
    }