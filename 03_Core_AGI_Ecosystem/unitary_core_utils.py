from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple

def compute_quantum_fidelity(data_stream: list[float]) -> float:
    """Computes the fidelity metric of a quantum data stream."""
    if not data_stream: return 0.0
    return sum(data_stream) / len(data_stream)

def execute_unitary_op(op_name: str, op_fn: Callable) -> Tuple[bool, float, Any]:
    """Executes a unitary operation with telemetry."""
    start = time.perf_counter()
    try:
        result = op_fn()
        duration = (time.perf_counter() - start) * 1000.0
        return True, round(duration, 3), result
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000.0
        return False, round(duration, 3), str(e)