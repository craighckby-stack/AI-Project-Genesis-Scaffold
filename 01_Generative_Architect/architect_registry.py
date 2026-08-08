"""
ARCHITECT REGISTRY
Role: Manages architectural component registration, validation, and system health telemetry.
Integration: Initialized by the package root to ensure system-wide architectural integrity.
Dependencies: architect_registry_utils.py
"""

from __future__ import annotations
import threading
from typing import Dict, Any, Callable, Optional
from .architect_registry_utils import (
    format_timestamp, 
    summarize_diagnostic_results, 
    execute_check_with_telemetry,
    DiagnosticResult
)

class ArchitectRegistry:
    """
    Thread-safe registry for architectural components with integrated 
    diagnostic telemetry and health reporting.
    """
    def __init__(self) -> None:
        self._registry: Dict[str, Callable[[], DiagnosticResult]] = {}
        self._lock = threading.RLock()
        self._last_report: Optional[Dict[str, Any]] = None

    def register_component(self, name: str, validator: Callable[[], DiagnosticResult]) -> None:
        """Registers a component validator with the registry."""
        with self._lock:
            self._registry[name] = validator

    def run_diagnostics(self) -> Dict[str, Any]:
        """
        Executes all registered diagnostic checks and returns a comprehensive 
        health report with telemetry.
        """
        with self._lock:
            results = {}
            for name, validator in self._registry.items():
                passed, duration, message, metadata = execute_check_with_telemetry(validator)
                results[name] = {
                    "passed": passed, 
                    "duration_ms": duration,
                    "message": message,
                    "metadata": metadata
                }
            
            summary = summarize_diagnostic_results(results)
            
            report = {
                "status": "HEALTHY" if summary['is_healthy'] else "DEGRADED",
                "timestamp": format_timestamp(),
                "summary": summary,
                "results": results
            }
            
            self._last_report = report
            return report

    def get_last_report(self) -> Optional[Dict[str, Any]]:
        """Returns the most recent diagnostic report."""
        with self._lock:
            return self._last_report

# Global singleton instance
architect_registry = ArchitectRegistry()