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
"""

from __future__ import annotations
from typing import Dict, Any, Callable, List
from .utilities_core import DiagnosticResult, validate_check_function
from .utilities_telemetry import summarize_results, execute_with_telemetry, format_timestamp

# Registry for test-specific diagnostic checks
_REGISTERED_CHECKS: Dict[str, Callable[[], bool]] = {}

def register_test_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a new diagnostic check function into the test harness."""
    if validate_check_function(check_fn):
        _REGISTERED_CHECKS[name] = check_fn

def run_all_test_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered diagnostic checks and generates a comprehensive report.
    """
    results: Dict[str, bool] = {}
    details: Dict[str, Any] = {}

    for name, check_fn in _REGISTERED_CHECKS.items():
        passed, duration = execute_with_telemetry(check_fn)
        results[name] = passed
        details[name] = {
            "passed": passed,
            "duration_ms": duration,
            "timestamp": format_timestamp()
        }

    return {
        "summary": summarize_results(results),
        "details": details,
        "generated_at": format_timestamp()
    }

def clear_registry() -> None:
    """Clears the current registry of diagnostic checks."""
    _REGISTERED_CHECKS.clear()

# Initialize default system integrity checks
def _check_system_ready() -> bool:
    return True

register_test_check("system_integrity", _check_system_ready)