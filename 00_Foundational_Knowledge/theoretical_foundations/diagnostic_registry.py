"""
DIAGNOSTIC REGISTRY FOR THEORETICAL FOUNDATIONS
Role: Manages diagnostic check registration and execution for the foundation layer.
Integration: Used by __init__.py to verify system integrity.
Upgraded to support telemetry, performance tracking, and structured reporting.
"""

import threading
import time
from typing import Dict, Callable, Any, NamedTuple, Optional
from .diagnostic_engine_utils import format_timestamp, summarize_diagnostic_results

class DiagnosticResult(NamedTuple):
    """Structured result for a single diagnostic check."""
    passed: bool
    message: str
    metadata: Dict[str, Any]

# Registry storage with thread-safe access
_registry: Dict[str, Callable[[], DiagnosticResult]] = {}
_lock = threading.RLock()

def register_foundation_check(name: str, check_fn: Callable[[], DiagnosticResult]) -> None:
    """
    Registers a diagnostic check function for the foundation layer.
    
    :param name: Unique identifier for the diagnostic check.
    :param check_fn: Callable returning a DiagnosticResult.
    """
    with _lock:
        _registry[name] = check_fn

def run_foundation_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered foundation checks with telemetry.
    Returns a comprehensive diagnostic report.
    
    :return: A dictionary containing status, timestamp, summary, and detailed check results.
    """
    with _lock:
        check_details: Dict[str, Any] = {}
        status_map: Dict[str, bool] = {}
        
        for name, check_fn in _registry.items():
            start_time = time.perf_counter()
            try:
                res = check_fn()
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                
                check_details[name] = {
                    "passed": res.passed,
                    "message": res.message,
                    "metadata": {
                        **res.metadata, 
                        "duration_ms": round(duration_ms, 3)
                    }
                }
                status_map[name] = res.passed
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                check_details[name] = {
                    "passed": False,
                    "message": f"Execution Error: {str(e)}",
                    "metadata": {
                        "duration_ms": round(duration_ms, 3),
                        "error_type": type(e).__name__
                    }
                }
                status_map[name] = False
        
        summary = summarize_diagnostic_results(status_map)
        
        return {
            "status": "HEALTHY" if summary["is_healthy"] else "DEGRADED",
            "timestamp": format_timestamp(),
            "summary": summary,
            "checks": check_details
        }

def get_registered_check_names() -> list[str]:
    """Returns a list of all currently registered diagnostic check names."""
    with _lock:
        return list(_registry.keys())

def clear_registry() -> None:
    """Clears all registered diagnostic checks. Use with caution."""
    with _lock:
        _registry.clear()