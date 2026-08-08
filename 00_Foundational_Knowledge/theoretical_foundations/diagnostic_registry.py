"""
DIAGNOSTIC REGISTRY FOR THEORETICAL FOUNDATIONS
Role: Manages diagnostic check registration and execution for the foundation namespace.
Integration: Used by __init__.py to ensure module integrity and system health.
"""

from __future__ import annotations
import time
from typing import Dict, Callable, Any, NamedTuple

class FoundationCheckResult(NamedTuple):
    passed: bool
    message: str
    duration_ms: float

_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_foundation_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a diagnostic check function."""
    _REGISTRY[name] = check_fn

def run_foundation_diagnostics() -> Dict[str, FoundationCheckResult]:
    """Executes all registered foundation checks with telemetry."""
    results = {}
    for name, check_fn in _REGISTRY.items():
        start = time.perf_counter()
        try:
            passed = bool(check_fn())
        except Exception:
            passed = False
        duration = (time.perf_counter() - start) * 1000.0
        results[name] = FoundationCheckResult(passed, "Success" if passed else "Failed", round(duration, 3))
    return results
