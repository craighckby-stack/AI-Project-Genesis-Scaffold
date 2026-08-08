from __future__ import annotations
import time
import uuid
import platform
import psutil
from typing import Tuple, Callable, Dict, Any

def generate_cognitive_id() -> str:
    """Generates a unique cognitive identifier for the AGI instance."""
    return f"HUXLEY-{uuid.uuid4().hex[:8].upper()}"

def execute_cognitive_check(check_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a cognitive module check with telemetry."""
    start = time.perf_counter()
    try:
        passed = bool(check_fn())
    except Exception:
        passed = False
    duration = (time.perf_counter() - start) * 1000.0
    return passed, round(duration, 3)

def get_system_telemetry() -> Dict[str, Any]:
    """Gathers system-level telemetry for AGI health reporting."""
    return {
        "platform": platform.platform(),
        "processor": platform.processor(),
        "memory_usage": psutil.virtual_memory().percent,
        "cpu_usage": psutil.cpu_percent(),
        "timestamp": time.time()
    }