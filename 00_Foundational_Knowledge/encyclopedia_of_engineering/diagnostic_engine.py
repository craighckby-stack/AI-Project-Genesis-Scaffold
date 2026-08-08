"""
DIAGNOSTIC ENGINE FOR ENCYCLOPEDIA OF ENGINEERING
Role: Validates knowledge base integrity, schema compliance, and performance metrics.
Integration: Imported by __init__.py to run self-diagnostics on initialization.
"""

from __future__ import annotations
import time
import logging
from typing import Dict, Any, Callable, NamedTuple

logger = logging.getLogger(__name__)

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

class DiagnosticEngine:
    def __init__(self):
        self._registry: Dict[str, Callable[[], DiagnosticResult]] = {}

    def register(self, name: str, check_fn: Callable[[], DiagnosticResult]) -> None:
        """Registers a diagnostic check function."""
        if not callable(check_fn):
            raise TypeError(f"Check function for '{name}' must be callable.")
        self._registry[name] = check_fn
        logger.debug(f"Registered diagnostic check: {name}")

    def run_all(self) -> Dict[str, Dict[str, Any]]:
        """Runs all registered diagnostic checks and returns a detailed report."""
        report = {}
        for name, check_fn in self._registry.items():
            start_time = time.perf_counter()
            try:
                result = check_fn()
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                report[name] = {
                    "passed": result.passed,
                    "message": result.message,
                    "duration_ms": round(duration_ms, 3),
                    "metadata": result.metadata
                }
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                logger.exception(f"Error executing diagnostic check '{name}'")
                report[name] = {
                    "passed": False,
                    "message": f"Exception raised: {str(e)}",
                    "duration_ms": round(duration_ms, 3),
                    "metadata": {}
                }
        return report

engine = DiagnosticEngine()
