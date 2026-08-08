"""
DIAGNOSTIC REGISTRY FOR THEORETICAL FOUNDATIONS
Role: Manages diagnostic check registration and execution for the foundation namespace.
Integration: Used by __init__.py to ensure module integrity and system health.
Delegates complex telemetry to diagnostic_registry_utils.py.
"""

from __future__ import annotations
from typing import Dict, Callable, Any, NamedTuple
from .diagnostic_registry_utils import (
    execute_with_telemetry, 
    summarize_foundation_results, 
    format_timestamp
)

class FoundationCheckResult(NamedTuple):
    passed: bool
    message: str
    duration_ms: float
    metadata: Dict[str, Any]

_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_foundation_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a diagnostic check function."""
    _REGISTRY[name] = check_fn

def run_foundation_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered foundation checks with telemetry.
    Returns a comprehensive diagnostic report including summary metrics.
    """
    results: Dict[str, FoundationCheckResult] = {}
    
    for name, check_fn in _REGISTRY.items():
        passed, duration = execute_with_telemetry(check_fn)
        results[name] = FoundationCheckResult(
            passed=passed,
            message="Success" if passed else "Diagnostic check failed",
            duration_ms=duration,
            metadata={"timestamp": format_timestamp()}
        )
    
    summary = summarize_foundation_results(results)
    
    return {
        "status": "HEALTHY" if summary["is_healthy"] else "DEGRADED",
        "timestamp": format_timestamp(),
        "summary": summary,
        "checks": {k: v._asdict() for k, v in results.items()}
    }