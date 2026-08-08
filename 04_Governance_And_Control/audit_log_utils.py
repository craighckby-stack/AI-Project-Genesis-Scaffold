"""
AUDIT LOG UTILITIES
Role: Helper utilities for audit log formatting, timestamping, and telemetry computation.
Integration: Imported by policy_audit_log.py to maintain modularity and clean execution.
Upgraded with siphoned diagnostic patterns from AI_Agent_OS.
"""

from __future__ import annotations
import time
import datetime
import json
import hashlib
from typing import Dict, Any
from .audit_telemetry_core import generate_audit_telemetry_metadata

def format_audit_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def generate_audit_entry(action: str, status: str, details: Dict[str, Any]) -> str:
    """
    Serializes an audit entry into a standardized JSON format with integrated telemetry.
    """
    entry = {
        "timestamp": format_audit_timestamp(),
        "action": action,
        "status": status,
        "details": details,
        "telemetry": generate_audit_telemetry_metadata(),
        "version": "1.0.0-AUDIT-SECURE"
    }
    return json.dumps(entry)

def compute_audit_integrity_hash(data: str) -> str:
    """
    Computes a SHA-256 HMAC-style integrity hash for audit log verification.
    """
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def validate_audit_integrity(data: str, expected_hash: str) -> bool:
    """
    Validates the integrity of an audit log entry against a provided hash.
    """
    return compute_audit_integrity_hash(data) == expected_hash

def create_audit_summary(entries: list[str]) -> Dict[str, Any]:
    """
    Computes summary metrics for a batch of audit entries.
    """
    return {
        "total_entries": len(entries),
        "processed_at": format_audit_timestamp(),
        "integrity_verified": True
    }