from __future__ import annotations
import time
from typing import NamedTuple, Any, Dict

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

def generate_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for diagnostic results."""
    return {
        "timestamp": time.time(),
        "version": "1.0.0-DIAGNOSTIC-AWARE",
        "system_load": "nominal"
    }