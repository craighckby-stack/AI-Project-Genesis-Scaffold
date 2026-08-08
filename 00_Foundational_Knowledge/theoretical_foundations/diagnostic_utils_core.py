"""
DIAGNOSTIC UTILITIES CORE
Role: Core logic for diagnostic validation, telemetry generation, and type definitions.
Integration: Delegated from diagnostic_engine_utils.py to maintain modularity.
Provides the foundational data structures and validation logic for the system's diagnostic suite.
"""

from __future__ import annotations
import time
import os
import platform
import threading
from typing import NamedTuple, Any, Dict, Callable, Optional

class DiagnosticResult(NamedTuple):
    """Standardized container for diagnostic check results."""
    passed: bool
    message: str
    metadata: Dict[str, Any]

def validate_check_function(func: Callable) -> bool:
    """
    Validates that a check function is callable and adheres to the expected signature.
    
    :param func: The function to validate.
    :return: Boolean indicating if the function is valid for execution.
    """
    return callable(func)

def generate_telemetry_metadata(context: Optional[str] = None) -> Dict[str, Any]:
    """
    Generates standard telemetry metadata for diagnostic results, 
    including system-level environment data.
    
    :param context: Optional context string to tag the telemetry.
    :return: Dictionary containing system metrics and diagnostic context.
    """
    return {
        "timestamp": time.time(),
        "thread_id": threading.get_ident(),
        "version": "1.0.0-DIAGNOSTIC-AWARE",
        "system": {
            "os": platform.system(),
            "release": platform.release(),
            "python_version": platform.python_version()
        },
        "context": context or "default_diagnostic_run"
    }

def format_diagnostic_message(passed: bool, message: str) -> str:
    """
    Standardizes the formatting of diagnostic messages for logs.
    
    :param passed: Boolean status of the check.
    :param message: The raw message content.
    :return: Formatted string.
    """
    status = "SUCCESS" if passed else "FAILURE"
    return f"[{status}] {message}"

def get_system_load_metrics() -> Dict[str, Any]:
    """
    Retrieves basic system load metrics if available.
    
    :return: Dictionary containing load average or process-specific metrics.
    """
    try:
        # Attempt to get load average on Unix-like systems
        load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else (0.0, 0.0, 0.0)
        return {
            "load_1m": load_avg[0],
            "load_5m": load_avg[1],
            "load_15m": load_avg[2]
        }
    except Exception:
        return {"load_1m": 0.0, "load_5m": 0.0, "load_15m": 0.0}