from __future__ import annotations
import hashlib
import uuid
import datetime
from typing import Any, Dict

def generate_sovereign_id() -> str:
    """Generates a unique identifier for sovereign operations."""
    return str(uuid.uuid4())

def compute_policy_integrity_hash(data: Dict[str, Any]) -> str:
    """Computes a SHA-256 integrity hash for policy context."""
    serialized = str(sorted(data.items()))
    return hashlib.sha256(serialized.encode()).hexdigest()

def format_sovereign_telemetry(action: str, status: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Formats sovereign telemetry for audit trails."""
    return {
        "id": generate_sovereign_id(),
        "timestamp": datetime.datetime.utcnow().isoformat() + 'Z',
        "action": action,
        "status": status,
        "metadata": metadata
    }