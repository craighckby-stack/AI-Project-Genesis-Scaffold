"""
DIAGNOSTIC REGISTRY FOR THEORETICAL FOUNDATIONS
Role: Manages the registration and execution of integrity checks for the foundations module.
Integration: Used by __init__.py to verify system readiness.
"""

from typing import Dict, Callable, Any, Tuple
import time

# Registry storage
_FOUNDATION_CHECKS: Dict[str, Callable[[], bool]] = {}

def register_foundation_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a diagnostic check function."""
    _FOUNDATION_CHECKS[name] = check_fn

def run_foundation_diagnostics() -> Dict[str, Any]:
    """Executes all registered checks and returns a diagnostic report."""
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
