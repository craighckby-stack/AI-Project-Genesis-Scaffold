from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, NamedTuple

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

def format_timestamp() -> str:
    return datetime.datetime.utcnow().isoformat() + 'Z'

def summarize_diagnostic_results(results: Dict[str, Any]) -> Dict[str, Any]:
    total = len(results)
    passed = sum(1 for r in results.values() if r.get('passed', False))
    failed = total - passed
    return {
        'total': total,
        'passed': passed,
        'failed': failed,
        'is_healthy': total > 0 and failed == 0,
        'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
    }

def execute_check_with_telemetry(check_fn: Callable[[], DiagnosticResult]) -> Tuple[bool, float, str, Dict[str, Any]]:
    start = time.perf_counter()
    try:
        result = check_fn()
        duration = (time.perf_counter() - start) * 1000.0
        return result.passed, round(duration, 3), result.message, result.metadata
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000.0
        return False, round(duration, 3), str(e), {}
