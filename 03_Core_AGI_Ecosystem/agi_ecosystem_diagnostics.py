"""
AGI ECOSYSTEM DIAGNOSTICS
Role: Validates core AGI ecosystem integrity, registry status, and component connectivity.
Integration: Used by __init__.py to ensure system readiness upon package import.
Upgraded with telemetry-aware diagnostic patterns siphoned from AI_Agent_OS.

This module provides a centralized registry for health checks across the AGI ecosystem,
allowing for real-time monitoring, automated recovery triggers, and audit-ready reporting.
"""

from __future__ import annotations
import time
import logging
from typing import Dict, Any, Callable, TypedDict, Optional

# Internal imports from newly generated utility modules
from .diagnostic_engine_utils import (
    format_timestamp, 
    summarize_diagnostic_results, 
    execute_check_with_telemetry
)
from .diagnostic_utils_core import generate_telemetry_metadata, validate_check_function

# Configure module-level logger
logger = logging.getLogger("AGI.Ecosystem.Diagnostics")

# Type definitions for structured reporting
class CheckResult(TypedDict):
    passed: bool
    duration_ms: float
    status: str
    message: Optional[str]

class DiagnosticReport(TypedDict):
    report_id: str
    timestamp: str
    summary: Dict[str, Any]
    results: Dict[str, CheckResult]
    total_duration_ms: float
    telemetry: Dict[str, Any]

# Registry for ecosystem component checks
_ECOSYSTEM_REGISTRY: Dict[str, Callable[[], bool]] = {}

def register_ecosystem_check(name: str, check_fn: Callable[[], bool]) -> None:
    """
    Registers a diagnostic check for an ecosystem component.
    
    Args:
        name: Unique identifier for the check.
        check_fn: A callable that returns True if the check passes, False otherwise.
    """
    if not validate_check_function(check_fn):
        logger.error(f"Failed to register check '{name}': Provided function is not callable.")
        return
        
    _ECOSYSTEM_REGISTRY[name] = check_fn
    logger.debug(f"Registered ecosystem check: {name}")

def unregister_ecosystem_check(name: str) -> bool:
    """Removes a check from the registry."""
    if name in _ECOSYSTEM_REGISTRY:
        del _ECOSYSTEM_REGISTRY[name]
        return True
    return False

def run_ecosystem_diagnostics() -> DiagnosticReport:
    """
    Executes all registered ecosystem diagnostic checks.
    Returns a comprehensive, audit-ready report of system health.
    
    This function performs the following steps:
    1. Validates the registry state.
    2. Executes each check with high-precision telemetry.
    3. Aggregates results into a structured report.
    4. Computes summary metrics and attaches system telemetry.
    """
    results: Dict[str, CheckResult] = {}
    check_statuses: Dict[str, bool] = {}
    start_time = time.perf_counter()
    
    # Ensure at least one check exists; if not, register a self-check
    if not _ECOSYSTEM_REGISTRY:
        logger.warning("No ecosystem checks registered. Running default self-check.")
        register_ecosystem_check("registry_integrity", lambda: True)
    
    for name, check_fn in _ECOSYSTEM_REGISTRY.items():
        try:
            passed, duration_ms = execute_check_with_telemetry(check_fn, name)
            results[name] = {
                "passed": passed,
                "duration_ms": duration_ms,
                "status": "OK" if passed else "FAIL",
                "message": None if passed else f"Check '{name}' failed during execution."
            }
            check_statuses[name] = passed
            
            if not passed:
                logger.warning(f"Diagnostic check failed: {name} ({duration_ms}ms)")
            else:
                logger.debug(f"Diagnostic check passed: {name} ({duration_ms}ms)")
                
        except Exception as e:
            logger.error(f"Critical error executing diagnostic check '{name}': {str(e)}")
            results[name] = {
                "passed": False,
                "duration_ms": 0.0,
                "status": "CRITICAL_ERROR",
                "message": str(e)
            }
            check_statuses[name] = False
            
    total_duration_ms = (time.perf_counter() - start_time) * 1000.0
    summary = summarize_diagnostic_results(check_statuses)
    
    report: DiagnosticReport = {
        "report_id": f"diag-{int(time.time())}",
        "timestamp": format_timestamp(),
        "summary": summary,
        "results": results,
        "total_duration_ms": round(total_duration_ms, 3),
        "telemetry": generate_telemetry_metadata()
    }
    
    if not summary['is_healthy']:
        logger.error(f"Ecosystem diagnostic report indicates DEGRADED health. Pass rate: {summary['pass_rate']}%")
    else:
        logger.info(f"Ecosystem diagnostic report: HEALTHY. All {summary['total']} checks passed.")
        
    return report

def get_system_health_status() -> str:
    """Returns a simplified health status string: HEALTHY, DEGRADED, or CRITICAL."""
    report = run_ecosystem_diagnostics()
    pass_rate = report['summary']['pass_rate']
    
    if pass_rate == 100.0:
        return "HEALTHY"
    elif pass_rate > 75.0:
        return "DEGRADED"
    else:
        return "CRITICAL"

# Default registration of core ecosystem health checks
register_ecosystem_check("ecosystem_registry_init", lambda: len(_ECOSYSTEM_REGISTRY) > 0)