"""
GOVERNANCE AND CONTROL KERNEL
Role: Orchestrates system-wide integrity, diagnostic validation, and governance policy enforcement.
Integration: Acts as the primary entry point for the 04_Governance_And_Control module.
"""

from typing import Dict, Any
from .governance_utils import (
    format_timestamp, 
    summarize_diagnostic_results, 
    execute_check_with_telemetry,
    DiagnosticResult
)

# Registry for system integrity checks
_GOVERNANCE_REGISTRY: Dict[str, Any] = {}

def register_governance_check(name: str, check_fn: callable):
    """Registers a new integrity check within the governance framework."""
    _GOVERNANCE_REGISTRY[name] = check_fn

def run_governance_diagnostics() -> Dict[str, Any]:
    """
    Executes the full suite of governance integrity checks.
    Returns a comprehensive diagnostic report.
    """
    results = {}
    check_statuses = {}
    
    for name, check_fn in _GOVERNANCE_REGISTRY.items():
        passed, duration, message, metadata = execute_check_with_telemetry(check_fn)
        results[name] = {
            "passed": passed,
            "duration_ms": duration,
            "message": message,
            "metadata": metadata
        }
        check_statuses[name] = passed

    return {
        "status": "HEALTHY" if all(check_statuses.values()) else "DEGRADED",
        "timestamp": format_timestamp(),
        "summary": summarize_diagnostic_results(check_statuses),
        "checks": results
    }

# Initialize default governance checks
def _check_system_ready() -> DiagnosticResult:
    return DiagnosticResult(True, "Governance kernel operational", {"version": "1.0.0"})

register_governance_check("kernel_ready", _check_system_ready)