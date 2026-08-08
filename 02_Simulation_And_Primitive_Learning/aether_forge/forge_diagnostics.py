"""
FORGE DIAGNOSTICS ENGINE
Role: Provides diagnostic telemetry, check registration, and health reporting for the Aether Forge.
Integration: Used by __init__.py to validate system integrity.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, NamedTuple, List

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

class ForgeReport(NamedTuple):
    status: str
    checks: Dict[str, Any]
    timestamp: str

_REGISTERED_CHECKS: Dict[str, Callable[[], DiagnosticResult]] = {}

def register_forge_check(name: str, check_fn: Callable[[], DiagnosticResult]):
    _REGISTERED_CHECKS[name] = check_fn

def run_forge_diagnostics() -> ForgeReport:
    results = {}
    all_passed = True
    
    for name, check_fn in _REGISTERED_CHECKS.items():
        res = check_fn()
        results[name] = res
        if not res.passed:
            all_passed = False
            
    return ForgeReport(
        status="HEALTHY" if all_passed else "DEGRADED",
        checks=results,
        timestamp=str(time.time())
    )