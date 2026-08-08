"""
DIAGNOSTIC REGISTRY FOR THEORETICAL FOUNDATIONS
Role: Manages diagnostic check registration and execution for the foundation layer.
Integration: Used by __init__.py to verify system integrity.
"""

import threading
from typing import Dict, Callable, Any, NamedTuple

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

_registry: Dict[str, Callable[[], DiagnosticResult]] = {}
_lock = threading.RLock()

def register_foundation_check(name: str, check_fn: Callable[[], DiagnosticResult]):
    with _lock:
        _registry[name] = check_fn

def run_foundation_diagnostics() -> Dict[str, Dict[str, Any]]:
    with _lock:
        results = {}
        for name, check_fn in _registry.items():
            try:
                res = check_fn()
                results[name] = {
                    "passed": res.passed,
                    "message": res.message,
                    "metadata": res.metadata
                }
            except Exception as e:
                results[name] = {
                    "passed": False,
                    "message": str(e),
                    "metadata": {}
                }
        return results
