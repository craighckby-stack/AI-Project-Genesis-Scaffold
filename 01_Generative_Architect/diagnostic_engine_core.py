from __future__ import annotations
import time
from typing import NamedTuple, Any, Dict, Callable

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

def execute_check_with_telemetry(check_fn: Callable[[], DiagnosticResult]) -> tuple[DiagnosticResult, float]:
    start_time = time.perf_counter()
    try:
        result = check_fn()
        duration = (time.perf_counter() - start_time) * 1000.0
        return result, round(duration, 3)
    except Exception as e:
        duration = (time.perf_counter() - start_time) * 1000.0
        return DiagnosticResult(False, str(e), {}), round(duration, 3)