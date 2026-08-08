"""
COMPLIANCE CORE TYPES
Role: Core logic for compliance validation, telemetry generation, and type definitions.
Integration: Delegated from compliance_utils.py to maintain modularity.
"""

from __future__ import annotations
import time
from typing import NamedTuple, Any, Dict, Callable

class ComplianceResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

def validate_compliance_function(func: Callable) -> bool:
    """Validates that a compliance check function is callable."""
    return callable(func)

def generate_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for compliance results."""
    return {
        "timestamp": time.time(),
        "system_id": "GOVERNANCE_CORE_04",
        "version": "1.0.0-COMPLIANCE-AWARE"
    }