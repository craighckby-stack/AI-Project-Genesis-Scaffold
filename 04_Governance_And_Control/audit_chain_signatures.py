"""
AUDIT CHAIN SIGNATURES
Role: Verifies the integrity and provenance of governance-level audit trails.
Integration: Connects to the Governance Authority Registry for cryptographic validation.
Dependencies: audit_chain_utils.py
"""

from __future__ import annotations
from typing import Dict, Any, Optional
from .audit_chain_utils import AuditSignatureEngine

class AuditChainVerifier:
    """
    Primary controller for verifying audit chain signatures within the 
    Governance and Control ecosystem.
    """
    
    def __init__(self):
        self.engine = AuditSignatureEngine()
        self.registry: Dict[str, Any] = {}

    def verify_entry(self, entry_id: str, payload: Dict[str, Any], signature: str, public_key: str) -> bool:
        """
        Validates an audit chain entry against provided cryptographic signatures.
        """
        is_valid = self.engine.verify_signature(payload, signature, public_key)
        
        # Log verification result for diagnostic telemetry
        self.registry[entry_id] = {
            "verified": is_valid,
            "timestamp": self.engine.get_telemetry()["timestamp"],
            "metadata": {"key_id": public_key[:8] + "..."}
        }
        
        return is_valid

    def get_audit_status(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves the verification status of a specific audit entry.
        """
        return self.registry.get(entry_id)

    def get_system_telemetry(self) -> Dict[str, Any]:
        """
        Returns diagnostic telemetry for the audit chain subsystem.
        """
        return {
            "subsystem": "AuditChainSignatures",
            "engine_metrics": self.engine.get_telemetry(),
            "total_verifications": len(self.registry)
        }

# Singleton instance for global access
audit_verifier = AuditChainVerifier()