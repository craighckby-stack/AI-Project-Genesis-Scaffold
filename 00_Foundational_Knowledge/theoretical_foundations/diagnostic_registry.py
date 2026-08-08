"""
DIAGNOSTIC REGISTRY FOR THEORETICAL FOUNDATIONS
Role: Manages the registration and execution of integrity checks for the foundations module.
Integration: Used by __init__.py to verify system readiness.
Upgraded to support thread-safe telemetry and diagnostic reporting.
"""

from __future__ import annotations
import threading
import time
from typing import Dict, Callable, Any
from .diagnostic_registry_utils import format_timestamp, summarize_diagnostic_results

# Registry storage with thread-safe access
_FOUNDATION_CHECKS: Dict[str, Callable[[], bool]] = {}
_REGISTRY_LOCK = threading.Lock()

def register_foundation_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a diagnostic check function with thread-safety."""
    with _REGISTRY_LOCK:
        _FOUNDATION_CHECKS[name] = check_fn

def run_foundation_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered checks and returns a comprehensive diagnostic report.
    Aligns with AI_Agent_OS diagnostic architecture.
    """
    results = {}
    
    with _REGISTRY_LOCK:
        checks_to_run = list(_FOUNDATION_CHECKS.items())

    for name, check in checks_to_run:
        start = time.perf_counter()
        try:
            passed = bool(check())
            duration = (time.perf_counter() - start) * 1000
            results[name] = {
                "passed": passed, 
                "duration_ms": round(duration, 3),
                "timestamp": format_timestamp()
            }
        except Exception as e:
            results[name] = {
                "passed": False, 
                "error": str(e),
                "timestamp": format_timestamp()
            }
            
    summary = summarize_diagnostic_results(results)
    
    return {
        "status": "HEALTHY" if summary["is_healthy"] else "DEGRADED",
        "timestamp": format_timestamp(),
        "summary": summary,
        "checks": results
    }

def get_registry_state() -> Dict[str, Any]:
    """Exports current registry state for auditing."""
    with _REGISTRY_LOCK:
        return {
            "registered_checks": list(_FOUNDATION_CHECKS.keys()),
            "count": len(_FOUNDATION_CHECKS)
        }