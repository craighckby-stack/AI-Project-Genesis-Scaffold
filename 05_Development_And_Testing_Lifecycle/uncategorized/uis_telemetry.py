"""
UI TELEMETRY HARNESS
Role: Provides structured telemetry and diagnostic reporting for UI components.
Integration: Acts as the primary telemetry emitter for the UI diagnostic lifecycle.
Dependencies: uis_telemetry_core.py
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, Optional
from .uis_telemetry_core import generate_ui_telemetry_metadata, UIResult

class UITelemetryEmitter:
    """
    Handles structured UI telemetry emission, performance tracking, and metadata enrichment.
    """
    def __init__(self, component_name: str):
        self.component_name = component_name
        self.start_time = time.perf_counter()

    def emit(self, passed: bool, message: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        duration = (time.perf_counter() - self.start_time) * 1000.0
        report = {
            "component": self.component_name,
            "status": "PASSED" if passed else "FAILED",
            "duration_ms": round(duration, 3),
            "message": message,
            "metadata": {**(metadata or {}), **generate_ui_telemetry_metadata()}
        }
        return report

def format_ui_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_ui_results(results: Dict[str, bool]) -> Dict[str, Any]:
    """Computes summary metrics for UI diagnostic check results."""
    total_checks = len(results)
    passed_checks = sum(1 for status in results.values() if status)
    failed_checks = total_checks - passed_checks
    is_healthy = total_checks > 0 and failed_checks == 0

    return {
        'total': total_checks,
        'passed': passed_checks,
        'failed': failed_checks,
        'is_healthy': is_healthy,
        'pass_rate': round((passed_checks / total_checks * 100), 2) if total_checks > 0 else 0.0
    }

def execute_ui_check_with_telemetry(check_fn: Callable[[], bool], check_type: str) -> Tuple[bool, float]:
    """Executes a UI diagnostic check and measures execution duration in milliseconds."""
    start_time = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception:
        return False, round((time.perf_counter() - start_time) * 1000.0, 3)