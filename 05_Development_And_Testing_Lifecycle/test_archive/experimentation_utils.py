"""
EXPERIMENTATION UTILITIES
Role: Helper utilities for experiment execution, telemetry, and result aggregation.
Integration: Imported by experimentation.py to compute metrics and format output.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_experiment_results(results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Computes summary metrics for experiment results.
    """
    total = len(results)
    passed = sum(1 for r in results.values() if r.get("passed", False))
    failed = total - passed
    return {
        'total': total,
        'passed': passed,
        'failed': failed,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0,
        'is_healthy': total > 0 and failed == 0
    }

def execute_with_telemetry(func: Callable) -> Tuple[bool, float, Any]:
    """
    Executes an experiment function and measures execution duration.
    """
    start_time = time.perf_counter()
    try:
        output = func()
        passed = True
    except Exception as e:
        output = str(e)
        passed = False
    duration_ms = (time.perf_counter() - start_time) * 1000.0
    return passed, round(duration_ms, 3), output
