"""
DIAGNOSTIC ENGINE FOR ENCYCLOPEDIA OF ENGINEERING
Role: Validates knowledge base integrity, schema compliance, and performance metrics.
Integration: Imported by __init__.py to run self-diagnostics on initialization.
Siphoned Patterns: AI_Agent_OS Diagnostic Engine (Telemetry, Registry, and Summary metrics).
"""

from __future__ import annotations
import logging
import time
from typing import Dict, Any, Callable, NamedTuple
from .diagnostic_utils import summarize_diagnostic_results, generate_system_telemetry

# Configure logger for the diagnostic engine
logger = logging.getLogger(__name__)

class DiagnosticResult(NamedTuple):
    """Container for individual diagnostic check outcomes."""
    passed: bool
    message: str
    metadata: Dict[str, Any]

class DiagnosticEngine:
    """
    Core engine for executing system-wide diagnostic checks.
    Maintains a registry of checks and produces comprehensive telemetry reports.
    """
    def __init__(self) -> None:
        self._registry: Dict[str, Callable[[], DiagnosticResult]] = {}

    def register(self, name: str, check_fn: Callable[[], DiagnosticResult]) -> None:
        """Registers a diagnostic check function into the engine registry."""
        if not callable(check_fn):
            raise TypeError(f"Check function for '{name}' must be callable.")
        self._registry[name] = check_fn
        logger.debug(f"Registered diagnostic check: {name}")

    def run_all(self) -> Dict[str, Any]:
        """
        Runs all registered diagnostic checks and returns a structured report 
        containing individual results, summary metrics, and system telemetry.
        """
        report_data: Dict[str, Any] = {}
        
        for name, check_fn in self._registry.items():
            start_time = time.perf_counter()
            try:
                result = check_fn()
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                report_data[name] = {
                    "passed": result.passed,
                    "message": result.message,
                    "duration_ms": round(duration_ms, 3),
                    "metadata": result.metadata
                }
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                logger.exception(f"Error executing diagnostic check '{name}'")
                report_data[name] = {
                    "passed": False,
                    "message": f"Exception raised: {str(e)}",
                    "duration_ms": round(duration_ms, 3),
                    "metadata": {"error": str(e)}
                }

        # Construct final report with summary and telemetry
        return {
            "status": "COMPLETED",
            "summary": summarize_diagnostic_results(report_data),
            "checks": report_data,
            "telemetry": generate_system_telemetry()
        }

# Global instance for system-wide diagnostic orchestration
engine = DiagnosticEngine()