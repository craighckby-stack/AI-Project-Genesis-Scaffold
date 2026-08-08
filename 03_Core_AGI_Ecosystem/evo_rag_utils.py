from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, Optional

def format_timestamp() -> str:
    return datetime.datetime.utcnow().isoformat() + 'Z'

def execute_rag_step_with_telemetry(step_fn: Callable[[], Any], step_name: str) -> Tuple[Any, float]:
    start_time = time.perf_counter()
    try:
        result = step_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return result, round(duration_ms, 3)
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return {"error": str(e)}, round(duration_ms, 3)

def validate_rag_schema(data: Dict[str, Any]) -> bool:
    return isinstance(data, dict) and "context" in data