"""
DIAGNOSTIC UTILITIES
Role: Helper functions for telemetry, duration measurement, and result aggregation.
"""

import time
from typing import Dict, Any, Tuple, Callable

def execute_check_with_telemetry(check_fn: Callable[[], bool], check_type: str) -> Tuple[bool, float]:
    start = time.perf_counter()
    try:
        passed = bool(check_fn())
    except Exception:
        passed = False
    duration = (time.perf_counter() - start) * 1000.0
    return passed, round(duration, 3)

def summarize_diagnostic_results(checks: Dict[str, bool]) -> Dict[str, Any]:
    total = len(checks)
    passed = sum(1 for v in checks.values() if v)
    return {
        "total": total,
        "passed": passed,
        "failed": total - passed,
        "is_healthy": total > 0 and passed == total
    }
