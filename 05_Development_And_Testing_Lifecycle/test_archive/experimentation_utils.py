"""
EXPERIMENTATION UTILITIES
Role: Helper utilities for experiment execution, telemetry formatting, and result aggregation.
Integration: Imported by experimentation.py to maintain modularity.
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
    passed = sum(1 for r in results.values() if r.get('passed', False))
    return {
        'total': total,
        'passed': passed,
        'failed': total - passed,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def execute_with_telemetry(func: Callable, *args, **kwargs) -> Tuple[bool, float, Any]:
    """
    Executes an experiment function and measures duration.
    """
    start = time.perf_counter()
    try:
        result = func(*args, **kwargs)
        duration = (time.perf_counter() - start) * 1000.0
        return True, round(duration, 3), result
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000.0
        return False, round(duration, 3), str(e)
