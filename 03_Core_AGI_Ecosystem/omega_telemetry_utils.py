from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable

def format_omega_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_omega_results(checks: Dict[str, bool]) -> Dict[str, Any]:
    total = len(checks)
    passed = sum(1 for status in checks.values() if status)
    return {
        'total': total,
        'passed': passed,
        'failed': total - passed,
        'is_healthy': total > 0 and (total - passed) == 0,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def execute_omega_check(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    start = time.perf_counter()
    try:
        passed = bool(check_fn())
        return passed, round((time.perf_counter() - start) * 1000.0, 3)
    except Exception:
        return False, round((time.perf_counter() - start) * 1000.0, 3)