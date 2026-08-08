"""
AGI KERNEL UTILITIES
Role: Core utility functions for AGI kernel identification, telemetry gathering, and lifecycle hook validation.
Integration: Centralized utility module for the AGI ecosystem, supporting audit-ready diagnostics.
"""

from __future__ import annotations
import uuid
import platform
import os
from typing import Any, Callable, Dict
from .agi_kernel_telemetry import get_extended_telemetry, validate_diagnostic_hook

def generate_kernel_id() -> str:
    """Generates a unique, persistent identifier for the kernel instance."""
    return f"agi-kernel-{uuid.uuid4().hex[:8]}"

def get_system_telemetry() -> Dict[str, Any]:
    """
    Gathers system-level telemetry.
    Delegates to agi_kernel_telemetry for extended diagnostic data.
    """
    base_telemetry = {
        "os": platform.system(),
        "arch": platform.machine(),
        "python_version": platform.python_version(),
        "pid": os.getpid()
    }
    base_telemetry.update(get_extended_telemetry())
    return base_telemetry

def validate_kernel_hook(hook: Callable) -> bool:
    """
    Validates that a hook is a callable function.
    Delegates to agi_kernel_telemetry for robust validation.
    """
    return validate_diagnostic_hook(hook)

def format_kernel_event(event_type: str, message: str) -> Dict[str, Any]:
    """
    Formats a kernel event for structured logging.
    """
    return {
        "event": event_type,
        "message": message,
        "telemetry": get_extended_telemetry()
    }