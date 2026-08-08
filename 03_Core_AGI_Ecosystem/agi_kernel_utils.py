"""
AGI KERNEL UTILITIES
Role: Helper utilities for kernel state management, lifecycle hooks, and telemetry.
Integration: Imported by agi_kernel.py to maintain modularity.
"""

from __future__ import annotations
import time
import uuid
from typing import Dict, Any, Callable

def generate_kernel_id() -> str:
    """Generates a unique identifier for the kernel instance."""
    return f"agi-kernel-{uuid.uuid4().hex[:8]}"

def get_system_telemetry() -> Dict[str, Any]:
    """Collects basic system telemetry for kernel health reporting."""
    return {
        "boot_time": time.time(),
        "status": "INITIALIZED",
        "version": "1.0.0-AGI-CORE"
    }

def validate_kernel_hook(hook: Callable) -> bool:
    """Validates that a lifecycle hook is callable."""
    return callable(hook)
