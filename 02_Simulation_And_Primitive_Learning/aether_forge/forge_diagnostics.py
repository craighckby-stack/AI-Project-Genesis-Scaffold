from __future__ import annotations
import time
from typing import Dict, Any, Callable, NamedTuple

class DiagnosticReport(NamedTuple):
    status: str
    checks: Dict[str, Any]

_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_forge_check(name: str, check_fn: Callable[[], bool]):
    _REGISTRY[name] = check_fn

def run_forge_diagnostics() -> DiagnosticReport:
    results = {}
    all_passed = True
    for name, check in _REGISTRY.items():
        try:
            passed = check()
            results[name] = {"passed": passed, "ts": time.time()}
            if not passed:
                all_passed = False
        except Exception:
            results[name] = {"passed": False, "ts": time.time()}
            all_passed = False
    
    return DiagnosticReport(
        status="HEALTHY" if all_passed else "DEGRADED",
        checks=results
    )