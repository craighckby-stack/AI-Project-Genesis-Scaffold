"""
DIAGNOSTIC ENGINE
Role: Manages registration and execution of self-validating diagnostic checks.
Siphoned from: craighckby-stack/AI_Agent_OS diagnostic engine patterns.
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
    def __init__(self) -> None:
        self._registry: Dict[str, Callable[[], DiagnosticResult]] = {}

    def register(self, name: str, check_fn: Callable[[], DiagnosticResult]) -> None:
        """Registers a diagnostic check function."""
        self._registry[name] = check_fn
        logger.debug(f"Registered diagnostic check: '{name}'")

    def run_all(self) -> Dict[str, Dict[str, Any]]:
        """Runs all registered diagnostic checks and returns telemetry."""
        report: Dict[str, Dict[str, Any]] = {}
        for name, check_fn in self._registry.items():
            start_time = time.perf_counter()
            try:
                result = check_fn()
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                
                meta = dict(result.metadata) if result.metadata else {}
                meta["duration_ms"] = round(duration_ms, 3)
                
                report[name] = {
                    "passed": result.passed,
                    "message": result.message,
                    "duration_ms": round(duration_ms, 3),
                    "metadata": meta
                }
            except Exception as e:
                duration_ms = (time.perf_counter() - start_time) * 1000.0
                logger.exception(f"Error executing diagnostic check '{name}'")
                report[name] = {
                    "passed": False,
                    "message": f"Unhandled exception: {str(e)}",
                    "duration_ms": round(duration_ms, 3),
                    "metadata": {"error": str(e)}
                }
        return report

engine = DiagnosticEngine()
