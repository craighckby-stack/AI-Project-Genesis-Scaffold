"""
REGISTRY DIAGNOSTICS
Role: Telemetry and diagnostic reporting for the Knowledge Registry.
Integration: Used by registry_utils.py to provide audit-ready system state reports.
"""

from __future__ import annotations
import time
from typing import Dict, Any

def generate_registry_telemetry(data_count: int, validator_count: int) -> Dict[str, Any]:
    """Generates standard telemetry metadata for registry audits."""
    return {
        "timestamp": time.time(),
        "data_count": data_count,
        "validator_count": validator_count,
        "version": "1.0.0-REGISTRY-AWARE",
        "status": "HEALTHY" if data_count == validator_count else "DEGRADED"
    }
