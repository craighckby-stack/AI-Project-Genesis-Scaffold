"""
POLICY AUDIT LOG
Role: Centralized logging engine for tracking policy changes, compliance events, 
      and governance-level state transitions.
Integration: Connects to Governance and Control layer for immutable audit trails.
Dependencies: audit_log_utils.py
"""

from __future__ import annotations
import logging
import os
from typing import Dict, Any, Optional
from .audit_log_utils import generate_audit_entry, compute_audit_integrity_hash

# Configure internal logger
logger = logging.getLogger("PolicyAuditLog")
logger.setLevel(logging.INFO)

class PolicyAuditLog:
    """
    Registry-based audit logging engine for policy-driven governance.
    Ensures every policy change is recorded with metadata and integrity hashes.
    """
    
    def __init__(self, log_path: str = "logs/policy_audit.log"):
        self.log_path = log_path
        self._ensure_log_directory()

    def _ensure_log_directory(self) -> None:
        """Ensures the log directory exists."""
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)

    def log_event(self, action: str, status: str, details: Dict[str, Any]) -> bool:
        """
        Records an audit event to the persistent log file.
        
        :param action: The policy action performed.
        :param status: The outcome (SUCCESS/FAILURE).
        :param details: Contextual metadata about the event.
        :return: Boolean indicating if the log was successfully written.
        """
        try:
            entry = generate_audit_entry(action, status, details)
            integrity_hash = compute_audit_integrity_hash(entry)
            
            with open(self.log_path, "a") as f:
                f.write(f"{integrity_hash} | {entry}\n")
            
            logger.info(f"Audit event recorded: {action} - {status}")
            return True
        except Exception as e:
            logger.error(f"Failed to record audit event: {e}")
            return False

    def get_audit_history(self) -> list[str]:
        """Retrieves the full audit trail."""
        if not os.path.exists(self.log_path):
            return []
        with open(self.log_path, "r") as f:
            return f.readlines()

# Singleton instance for global governance access
audit_logger = PolicyAuditLog()