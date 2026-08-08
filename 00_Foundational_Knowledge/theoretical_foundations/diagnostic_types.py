"""
DIAGNOSTIC TYPES
Role: Shared type definitions for diagnostic operations.
Integration: Used by registry utilities to ensure type safety across the diagnostic pipeline.
"""

from typing import NamedTuple, Any, Dict

class RegistryDiagnosticResult(NamedTuple):
    passed: bool
    message: str
    duration_ms: float
    metadata: Dict[str, Any]
