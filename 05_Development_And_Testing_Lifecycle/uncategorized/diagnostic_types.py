"""
DIAGNOSTIC TYPES
Role: Core type definitions for diagnostic results and telemetry schemas.
Integration: Shared across diagnostic modules to ensure type safety.
"""

from typing import NamedTuple, Any, Dict

class DiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]
    duration_ms: float

class DiagnosticReport(NamedTuple):
    status: str
    timestamp: str
    checks: Dict[str, DiagnosticResult]
    summary: Dict[str, Any]
