import time
from typing import Any, Dict, Callable, Tuple

def execute_mutation_step(step_name: str, mutation_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a mutation step and measures performance telemetry."""
    start = time.perf_counter()
    try:
        success = mutation_fn()
        duration = (time.perf_counter() - start) * 1000
        return success, round(duration, 3)
    except Exception:
        return False, round((time.perf_counter() - start) * 1000, 3)

def get_system_metadata() -> Dict[str, Any]:
    """Returns metadata for the current evolution cycle."""
    return {
        "engine": "DARLEK_CANN_V3",
        "timestamp": time.time(),
        "status": "ACTIVE"
    }