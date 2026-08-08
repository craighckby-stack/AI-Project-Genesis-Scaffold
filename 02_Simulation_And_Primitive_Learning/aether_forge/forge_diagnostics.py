"""
FORGE DIAGNOSTIC ENGINE
Role: Validates kernel integrity, memory persistence, and registry sync for the Aether Forge.
Integration: Used by __init__.py to verify system state before primitive learning.
"""

from __future__ import annotations
import time
import logging
from typing import Dict, Any, Callable, NamedTuple, List

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

class ForgeReport(NamedTuple):
    status: str
    checks: Dict[str, DiagnosticResult]

_REGISTERED_CHECKS: Dict[str, Callable[[], DiagnosticResult]] = {}

def register_forge_check(name: str, check_fn: Callable[[], DiagnosticResult]) -> None:
    """Registers a diagnostic check for the forge."""
    _REGISTERED_CHECKS[name] = check_fn

def run_forge_diagnostics() -> ForgeReport:
    """Executes all registered forge diagnostics."""
    results = {}
    for name, check_fn in _REGISTERED_CHECKS.items():
        try:
            results[name] = check_fn()
        except Exception as e:
            results[name] = DiagnosticResult(False, str(e), {})
    
    all_passed = all(r.passed for r in results.values())
    status = "HEALTHY" if all_passed else "DEGRADED"
    return ForgeReport(status, results)
