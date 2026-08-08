from __future__ import annotations
from typing import NamedTuple, Any, Dict

class SovereignResult(NamedTuple):
    """Structured result for sovereign operations."""
    success: bool
    message: str
    integrity_hash: str
    metadata: Dict[str, Any]

class TelemetryPacket(NamedTuple):
    """Standardized telemetry packet for audit trails."""
    id: str
    timestamp: str
    action: str
    status: str
    payload: Dict[str, Any]