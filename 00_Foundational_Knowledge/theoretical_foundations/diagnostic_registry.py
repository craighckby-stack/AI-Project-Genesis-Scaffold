"""
DIAGNOSTIC REGISTRY
Role: Manages the registration and execution of integrity checks for the theoretical foundations module.
Integration: Used by __init__.py to ensure system health.
"""

from typing import Callable, Dict, Any, List
import time

# Registry for foundation-specific diagnostic checks
_FOUNDATION_CHECKS: Dict[str, Callable[[], bool]] = {}

def register_foundation_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a new diagnostic check for the foundations module."""
    _FOUNDATION_CHECKS[name] = check_fn

def run_foundation_diagnostics() -> Dict[str, Any]:
    """Executes all registered foundation checks and returns a status report."""
    results = {}
    for name, check in _FOUNDATION_CHECKS.items():
        start = time.perf_counter()
        try:
            passed = check()
            duration = (time.perf_counter() - start) * 1000
            results[name] = {"passed": passed, "duration_ms": round(duration, 3)}
        except Exception as e:
            results[name] = {"passed": False, "error": str(e)}
    return results
