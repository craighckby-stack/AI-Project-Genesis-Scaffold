"""
FORGE DIAGNOSTIC ENGINE
Role: Validates kernel integrity, memory persistence, and registry sync for the Aether Forge.
Integration: Used by __init__.py to verify system state before primitive learning.
Upgraded with telemetry-aware execution and structured reporting patterns.
"""

from __future__ import annotations
import logging
from typing import Dict, Any, Callable, NamedTuple
from .forge_diagnostic_utils import (
    format_timestamp, 
    summarize_diagnostic_results, 
    execute_with_telemetry
)

# Setup logging for the forge diagnostic engine
logger = logging.getLogger("AetherForge.Diagnostics")

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]
    duration_ms: float = 0.0

class ForgeReport(NamedTuple):
    status: str
    timestamp: str
    summary: Dict[str, Any]
    checks: Dict[str, DiagnosticResult]

_REGISTERED_CHECKS: Dict[str, Callable[[], DiagnosticResult]] = {}

def register_forge_check(name: str, check_fn: Callable[[], DiagnosticResult]) -> None:
    """Registers a diagnostic check for the forge."""
    _REGISTERED_CHECKS[name] = check_fn

def run_forge_diagnostics() -> ForgeReport:
    """
    Executes all registered forge diagnostics with telemetry tracking.
    Returns a comprehensive ForgeReport for system verification.
    """
    results: Dict[str, DiagnosticResult] = {}
    
    for name, check_fn in _REGISTERED_CHECKS.items():
        try:
            # Execute check with telemetry wrapper
            result, duration = execute_with_telemetry(check_fn)
            results[name] = DiagnosticResult(
                passed=result.passed,
                message=result.message,
                metadata={**result.metadata, "telemetry_enabled": True},
                duration_ms=duration
            )
        except Exception as e:
            logger.error(f"Diagnostic check '{name}' failed execution: {e}")
            results[name] = DiagnosticResult(False, str(e), {"error": True}, 0.0)
    
    summary = summarize_diagnostic_results(results)
    status = "HEALTHY" if summary['is_healthy'] else "DEGRADED"
    
    return ForgeReport(
        status=status,
        timestamp=format_timestamp(),
        summary=summary,
        checks=results
    )