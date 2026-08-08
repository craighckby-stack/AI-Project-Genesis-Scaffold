"""
DIAGNOSTIC ENGINE: UNCATEGORIZED LIFECYCLE
Role: Validates integrity of uncategorized development assets and test lifecycle states.
Integration: Entry point for diagnostic registry and execution.
Dependencies: .diagnostic_utils
"""

from typing import Dict, Callable, Any, List
from .diagnostic_utils import (
    execute_check_with_telemetry, 
    summarize_diagnostic_results, 
    format_timestamp
)

# Registry of diagnostic checks
_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a diagnostic check to the uncategorized lifecycle suite."""
    _REGISTRY[name] = check_fn

def run_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered diagnostics and returns a comprehensive report.
    
    Returns a dictionary containing:
    - summary: Aggregated metrics (total, passed, failed, pass_rate)
    - checks: Detailed results per check (passed, duration_ms)
    - timestamp: UTC execution time
    """
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
        "timestamp": format_timestamp(),
        "summary": summarize_diagnostic_results(raw_statuses),
        "checks": results
    }

def clear_registry() -> None:
    """Clears all registered diagnostic checks."""
    _REGISTRY.clear()