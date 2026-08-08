from typing import NamedTuple, Any, Dict

class DiagnosticCheckResult(NamedTuple):
    passed: bool
    duration_ms: float
    message: str
    metadata: Dict[str, Any]

class DiagnosticReport(NamedTuple):
    status: str
    timestamp: str
    checks: Dict[str, Any]
    summary: Dict[str, Any]
    telemetry: Dict[str, Any]