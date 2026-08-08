"""
AGI ECOSYSTEM DIAGNOSTICS
Role: Validates core AGI ecosystem integrity, registry status, and component connectivity.
Integration: Used by __init__.py to ensure system readiness upon package import.
Upgraded with telemetry-aware diagnostic patterns from AI_Agent_OS.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable
from .diagnostic_engine_utils import (
    format_timestamp, 
    summarize_diagnostic_results, 
    execute_check_with_telemetry
)
from .diagnostic_utils_core import generate_telemetry_metadata

# Registry for ecosystem component checks
_ECOSYSTEM_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_ecosystem_check(name: str, check_fn: Callable[[], bool]) -> None:
    """Registers a diagnostic check for an ecosystem component."""
    _ECOSYSTEM_REGISTRY[name] = check_fn

def run_ecosystem_diagnostics() -> Dict[str, Any]:
    """
    Executes all registered ecosystem diagnostic checks.
    Returns a comprehensive, audit-ready report of system health.
    """
    results = {}
    check_statuses = {}
    start_time = time.perf_counter()
    
    for name, check_fn in _ECOSYSTEM_REGISTRY.items():
        passed, duration_ms = execute_check_with_telemetry(check_fn, name)
        results[name] = {
            "passed": passed,
            "duration_ms": duration_ms,
            "status": "OK" if passed else "FAIL"
        }
        check_statuses[name] = passed
            
    total_duration_ms = (time.perf_counter() - start_time) * 1000.0
    summary = summarize_diagnostic_results(check_statuses)
    
    return {
        "report_id": f"diag-{int(time.time())}",
        "timestamp": format_timestamp(),
        "summary": summary,
        "results": results,
        "total_duration_ms": round(total_duration_ms, 3),
        "telemetry": generate_telemetry_metadata()
    }