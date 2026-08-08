from __future__ import annotations
import uuid
import platform
import os
from typing import Any, Callable, Dict

def generate_kernel_id() -> str:
    """Generates a unique identifier for the kernel instance."""
    return f"agi-kernel-{uuid.uuid4().hex[:8]}"

def get_system_telemetry() -> Dict[str, Any]:
    """Gathers system-level telemetry."""
    return {
        "os": platform.system(),
        "arch": platform.machine(),
        "python_version": platform.python_version(),
        "pid": os.getpid()
    }

def validate_kernel_hook(hook: Callable) -> bool:
    """Validates that a hook is a callable function."""
    return callable(hook)
