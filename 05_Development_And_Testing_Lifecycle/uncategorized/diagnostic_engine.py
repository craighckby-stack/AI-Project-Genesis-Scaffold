"""
DIAGNOSTIC ENGINE: UNCATEGORIZED LIFECYCLE
Role: Validates integrity of uncategorized development assets and test lifecycle states.
Integration: Entry point for diagnostic registry and execution.
"""

from typing import Dict, Callable, Any, List
from .diagnostic_utils import execute_check_with_telemetry, summarize_diagnostic_results

_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a diagnostic check to the uncategorized lifecycle suite."""
    _REGISTRY[name] = check_fn

def run_diagnostics() -> Dict[str, Any]:
    """Executes all registered diagnostics and returns a comprehensive report."""
    results = {}
    raw_statuses = {}
    
    for name, func in _REGISTRY.items():
        passed, duration = execute_check_with_telemetry(func, name)
        results[name] = {
            "passed": passed,
            "duration_ms": duration
        }
        raw_statuses[name] = passed
        
    return {
        "summary": summarize_diagnostic_results(raw_statuses),
        "checks": results
    }
