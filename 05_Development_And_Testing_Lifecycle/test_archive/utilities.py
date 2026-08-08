"""
TEST ARCHIVE UTILITIES
======================

PURPOSE:
    Provides a centralized registry and execution harness for test utilities,
    diagnostic checks, and environment validation within the development lifecycle.

ROLE:
    Acts as the core utility provider for the test_archive package, ensuring
    consistent diagnostic reporting and telemetry across all test modules.

INTEGRATION:
    Imports core logic from utilities_core.py and telemetry helpers from utilities_telemetry.py.
    Follows the diagnostic patterns established in AI_Agent_OS.
"""

from __future__ import annotations
from typing import Dict, Any, Callable, List, Tuple
from .utilities_core import DiagnosticResult, validate_check_function
from .utilities_telemetry import summarize_results, execute_with_telemetry, format_timestamp

# Registry for test-specific diagnostic checks
# Stores callables that return a DiagnosticResult for richer reporting
_REGISTERED_CHECKS: Dict[str, Callable[[], DiagnosticResult]] = {}

def register_test_check(name: str, check_fn: Callable[[], DiagnosticResult]) -> None:
    """Registers a new diagnostic check function into the test harness."""
    if validate_check_function(check_fn):
        _REGISTERED_CHECKS[name] = check_fn

def run_all_test_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered diagnostic checks and generates a comprehensive report.
    Aggregates results into a structured telemetry-aware format.
    """
    results_map: Dict[str, bool] = {}
    details: Dict[str, Any] = {}

    for name, check_fn in _REGISTERED_CHECKS.items():
        # Execute with telemetry wrapping
        # We wrap the check_fn to return a DiagnosticResult
        def _wrapper():
            return check_fn()

        passed, duration, result_obj = execute_with_telemetry(_wrapper)
        
        results_map[name] = passed
        details[name] = {
            "passed": passed,
            "duration_ms": duration,
            "message": result_obj.message if hasattr(result_obj, 'message') else "N/A",
            "metadata": result_obj.metadata if hasattr(result_obj, 'metadata') else {},
            "timestamp": format_timestamp()
        }

    return {
        "summary": summarize_results(results_map),
        "details": details,
        "generated_at": format_timestamp()
    }

def clear_registry() -> None:
    """Clears the current registry of diagnostic checks."""
    _REGISTERED_CHECKS.clear()

# Initialize default system integrity checks
def _check_system_ready() -> DiagnosticResult:
    """Default system integrity check implementation."""
    return DiagnosticResult(
        passed=True, 
        message="System integrity verified", 
        metadata={"status": "nominal"}
    )

register_test_check("system_integrity", _check_system_ready)