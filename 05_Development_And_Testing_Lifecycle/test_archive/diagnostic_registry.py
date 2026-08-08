"""
DIAGNOSTIC REGISTRY
Role: Maintains the registry of test archive diagnostic checks.
Integration: Used by the package to expose diagnostic capabilities and telemetry-aware validation.
Dependencies: diagnostic_utils.py
"""

from typing import Dict, Callable, Tuple, Any
from .diagnostic_utils import (
    DiagnosticResult, 
    execute_check_with_telemetry, 
    summarize_diagnostic_results
)

# Registry for test archive diagnostic checks
# Expected signature: () -> Tuple[bool, str]
TEST_ARCHIVE_CHECKS: Dict[str, Callable[[], Tuple[bool, str]]] = {}

def register_test_check(name: str, check_fn: Callable[[], Tuple[bool, str]]) -> None:
    """Registers a new diagnostic check for the test archive."""
    TEST_ARCHIVE_CHECKS[name] = check_fn

def get_all_checks() -> Dict[str, Callable[[], Tuple[bool, str]]]:
    """Returns all registered diagnostic checks."""
    return TEST_ARCHIVE_CHECKS

def run_all_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered diagnostic checks and returns a comprehensive report.
    """
    results: Dict[str, DiagnosticResult] = {}
    
    for name, check_fn in TEST_ARCHIVE_CHECKS.items():
        results[name] = execute_check_with_telemetry(check_fn, name)
        
    summary = summarize_diagnostic_results(results)
    
    return {
        "summary": summary,
        "details": {k: v._asdict() for k, v in results.items()}
    }