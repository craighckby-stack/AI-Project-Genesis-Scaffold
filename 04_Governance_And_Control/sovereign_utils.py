"""
SOVEREIGN UTILITIES
Role: Core governance and integrity utilities for the Sovereign Control System.
Integration: Provides cryptographic hashing, telemetry formatting, and structured 
             result types for sovereign.py and related governance modules.
Dependencies: sovereign_types.py (for structured data definitions).
"""

from __future__ import annotations
import hashlib
import uuid
import datetime
import json
from typing import Any, Dict
from .sovereign_types import SovereignResult, TelemetryPacket

def generate_sovereign_id() -> str:
    """Generates a unique, cryptographically secure identifier for sovereign operations."""
    return str(uuid.uuid4())

def compute_policy_integrity_hash(data: Dict[str, Any]) -> str:
    """
    Computes a SHA-256 integrity hash for policy context.
    Uses deterministic JSON serialization to ensure consistent hash generation.
    """
    serialized = json.dumps(data, sort_keys=True)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

def format_sovereign_telemetry(action: str, status: str, metadata: Dict[str, Any]) -> TelemetryPacket:
    """
    Formats sovereign telemetry into a standardized TelemetryPacket for audit trails.
    """
    return TelemetryPacket(
        id=generate_sovereign_id(),
        timestamp=datetime.datetime.utcnow().isoformat() + 'Z',
        action=action,
        status=status,
        payload=metadata
    )

def create_sovereign_result(success: bool, message: str, data: Dict[str, Any]) -> SovereignResult:
    """
    Creates a structured SovereignResult with an embedded integrity hash.
    """
    integrity_hash = compute_policy_integrity_hash(data)
    return SovereignResult(
        success=success,
        message=message,
        integrity_hash=integrity_hash,
        metadata=data
    )

def validate_integrity(result: SovereignResult, original_data: Dict[str, Any]) -> bool:
    """
    Verifies that the integrity hash matches the provided data.
    """
    return result.integrity_hash == compute_policy_integrity_hash(original_data)