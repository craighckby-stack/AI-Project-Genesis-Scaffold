"""
AGI ECOSYSTEM DIAGNOSTICS
Role: Validates core AGI ecosystem integrity, registry status, and component connectivity.
Integration: Used by __init__.py to ensure system readiness upon package import.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple

# Registry for ecosystem component checks
_ECOSYSTEM_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_ecosystem_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a diagnostic check for an ecosystem component."""
    _ECOSYSTEM_REGISTRY[name] = check_fn

def run_ecosystem_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered ecosystem diagnostic checks.
    Returns a comprehensive report of system health.
    """
    results = {}
    start_time = time.perf_counter()
    
    for name, check_fn in _ECOSYSTEM_REGISTRY.items():
        try:
            passed = check_fn()
            results[name] = {"passed": passed, "status": "OK" if passed else "FAIL"}
        except Exception as e:
            results[name] = {"passed": False, "status": "ERROR", "error": str(e)}
            
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    
    return {
        "timestamp": time.time(),
        "total_checks": len(_ECOSYSTEM_REGISTRY),
        "results": results,
        "duration_ms": round(duration_ms, 3),
        "system_healthy": all(r["passed"] for r in results.values())
    }
