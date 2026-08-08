"""
DIAGNOSTIC REGISTRY FOR THEORETICAL FOUNDATIONS
Role: Manages diagnostic check registration and execution for the foundation layer.
Integration: Used by __init__.py to verify system integrity.
Upgraded to support telemetry, performance tracking, and structured reporting.
"""

import threading
import time
from typing import Dict, Callable, Any, NamedTuple
from .diagnostic_engine_utils import format_timestamp, summarize_diagnostic_results

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

# Registry storage with thread-safe access
_registry: Dict[str, Callable[[], DiagnosticResult]] = {}
_lock = threading.RLock()

def register_foundation_check(name: str, check_fn: Callable[[], DiagnosticResult]):
    """Registers a diagnostic check function for the foundation layer."""
    with _lock:
        _registry[name] = check_fn

def run_foundation_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered foundation checks with telemetry.
    Returns a comprehensive diagnostic report.
    """
    with _lock:
        results = {}
        check_details = {}
        
        for name, check_fn in _registry.items():
            start_time = time.perf_counter()
            try:
                res = check_fn()
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                
                check_details[name] = {
                    "passed": res.passed,
                    "message": res.message,
                    "metadata": {**res.metadata, "duration_ms": round(duration_ms, 3)}
                }
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                check_details[name] = {
                    "passed": False,
                    "message": f"Execution Error: {str(e)}",
                    "metadata": {"duration_ms": round(duration_ms, 3)}
                }
        
        summary = summarize_diagnostic_results(check_details)
        
        return {
            "status": "HEALTHY" if summary["is_healthy"] else "DEGRADED",
            "timestamp": format_timestamp(),
            "summary": summary,
            "checks": check_details
        }