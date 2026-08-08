"""
AGI KERNEL TELEMETRY UTILITIES
Role: Provides advanced telemetry gathering and diagnostic metric computation.
Integration: Used by agi_kernel_utils.py and agi_kernel.py for audit-ready reporting.
"""

from __future__ import annotations
import time
import platform
import os
from typing import Dict, Any, Tuple, Callable

def get_extended_telemetry() -> Dict[str, Any]:
    """Gathers comprehensive system-level telemetry for audit logs."""
    return {
        "os": platform.system(),
        "release": platform.release(),
        "arch": platform.machine(),
        "python_version": platform.python_version(),
        "pid": os.getpid(),
        "timestamp": time.time()
    }

def compute_execution_metrics(start_time: float) -> float:
    """Computes duration in milliseconds since start_time."""
    return round((time.perf_counter() - start_time) * 1000.0, 3)

def validate_diagnostic_hook(func: Callable) -> bool:
    """Validates that a diagnostic hook is a callable function."""
    return callable(func)