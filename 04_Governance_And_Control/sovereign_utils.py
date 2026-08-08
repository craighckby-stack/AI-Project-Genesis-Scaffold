"""
SOVEREIGN UTILITIES
Role: Helper utilities for sovereign state validation, policy enforcement telemetry, and registry management.
Integration: Imported by sovereign.py to maintain modularity.
"""

from __future__ import annotations
import time
import uuid
from typing import Dict, Any, Callable, List

def generate_sovereign_id() -> str:
    """Generates a unique identifier for sovereign state transitions."""
    return f"SOV-{uuid.uuid4().hex[:8].upper()}"

def compute_policy_integrity_hash(policy_data: Dict[str, Any]) -> str:
    """Computes a pseudo-integrity hash for policy state validation."""
    import hashlib
    import json
    content = json.dumps(policy_data, sort_keys=True)
    return hashlib.sha256(content.encode()).hexdigest()[:16]

def format_sovereign_telemetry(action: str, status: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    """Formats telemetry for sovereign actions."""
    return {
        "action": action,
        "status": status,
        "timestamp": time.time(),
        "metadata": metadata
    }