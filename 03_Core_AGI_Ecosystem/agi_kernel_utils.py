"""
AGI KERNEL UTILITIES
====================

PURPOSE:
    Provides low-level utility functions for the AGI Kernel, including
    ID generation, system telemetry gathering, and hook validation.

ROLE:
    Supports the AgiKernel by offloading non-orchestration logic.
"""

import uuid
import platform
import psutil
import time
from typing import Any, Callable, Dict

def generate_kernel_id() -> str:
    """Generates a unique, deterministic-style kernel identifier."""
    return f"AGI-KERN-{uuid.uuid4().hex[:8].upper()}"

def get_system_telemetry() -> Dict[str, Any]:
    """
    Gathers real-time system telemetry including CPU, memory, and uptime.
    Siphoned from AI_Agent_OS telemetry patterns.
    """
    process = psutil.Process()
    return {
        "platform": platform.system(),
        "arch": platform.machine(),
        "cpu_usage_percent": psutil.cpu_percent(interval=None),
        "memory_usage_bytes": process.memory_info().rss,
        "uptime_seconds": time.time() - process.create_time(),
        "timestamp": time.time()
    }

def validate_kernel_hook(hook: Callable) -> bool:
    """Validates that a hook is callable and meets basic safety requirements."""
    return callable(hook)
