import time
from typing import Dict, Any, Callable, Tuple

def execute_learning_cycle(cycle_id: str, logic_fn: Callable) -> Dict[str, Any]:
    """Executes a learning cycle with integrated telemetry."""
    start = time.perf_counter()
    try:
        result = logic_fn()
        duration = (time.perf_counter() - start) * 1000
        return {
            "cycle_id": cycle_id,
            "success": True,
            "duration_ms": round(duration, 3),
            "result": result
        }
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000
        return {
            "cycle_id": cycle_id,
            "success": False,
            "duration_ms": round(duration, 3),
            "error": str(e)
        }