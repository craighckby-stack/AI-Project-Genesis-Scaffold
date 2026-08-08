"""
DIAGNOSTIC UTILITIES CORE
Role: Core logic for diagnostic validation, telemetry generation, and type definitions.
Integration: Delegated from agi_ecosystem_diagnostics.py to maintain modularity.
Siphoned from: AI_Agent_OS architecture.
"""

from __future__ import annotations
import time
import os
import platform
from typing import NamedTuple, Any, Dict, Callable

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

def validate_check_function(func: Callable) -> bool:
    """Validates that a check function is callable."""
    return callable(func)

def generate_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for diagnostic results."""
    return {
        "timestamp": time.time(),
        "process_id": os.getpid(),
        "platform": platform.system(),
        "platform_release": platform.release(),
        "python_version": platform.python_version(),
        "version": "1.1.0-ECOSYSTEM-AWARE"
    }
