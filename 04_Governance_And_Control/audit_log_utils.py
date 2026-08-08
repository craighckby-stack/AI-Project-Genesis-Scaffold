"""
AUDIT LOG UTILITIES
Role: Helper utilities for audit log formatting, timestamping, and telemetry computation.
Integration: Imported by policy_audit_log.py to maintain modularity and clean execution.
"""

from __future__ import annotations
import time
import datetime
import json
from typing import Dict, Any

def format_audit_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def generate_audit_entry(action: str, status: str, details: Dict[str, Any]) -> str:
    """
    Serializes an audit entry into a standardized JSON format.
    """
    entry = {
        "timestamp": format_audit_timestamp(),
        "action": action,
        "status": status,
        "details": details,
        "version": "1.0.0-AUDIT-SECURE"
    }
    return json.dumps(entry)

def compute_audit_integrity_hash(data: str) -> str:
    """
    Simple integrity check placeholder; in production, this would be a SHA-256 HMAC.
    """
    import hashlib
    return hashlib.sha256(data.encode()).hexdigest()
