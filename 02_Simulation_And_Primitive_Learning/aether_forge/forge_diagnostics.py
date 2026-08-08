"""
FORGE DIAGNOSTIC ENGINE
Role: Validates kernel integrity, memory persistence, and forge state for the Aether Forge system.
Integration: Initialized by aether_forge/__init__.py.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, NamedTuple

class ForgeDiagnosticReport(NamedTuple):
    status: str
    timestamp: str
    checks: Dict[str, Any]

_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_forge_check(name: str, check_fn: Callable[[], bool]):
    """Registers a diagnostic check for the forge."""
    _REGISTRY[name] = check_fn

def run_forge_diagnostics() -> ForgeDiagnosticReport:
    """Executes all registered forge diagnostics."""
    results = {}
    for name, check in _REGISTRY.items():
        start = time.perf_counter()
        try:
            passed = check()
            duration = (time.perf_counter() - start) * 1000
            results[name] = {"passed": passed, "duration_ms": round(duration, 3)}
        except Exception as e:
            results[name] = {"passed": False, "error": str(e)}
            
    is_healthy = all(r.get("passed", False) for r in results.values())
    return ForgeDiagnosticReport(
        status="HEALTHY" if is_healthy else "DEGRADED",
        timestamp=str(time.time()),
        checks=results
    )
