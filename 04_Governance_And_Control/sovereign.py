"""
SOVEREIGN GOVERNANCE ENGINE
Role: Framework for system safety, self-regulation, and policy enforcement.
Integration: Acts as the primary controller for governance-level constraints.
Dependencies: sovereign_utils.py
"""

from __future__ import annotations
from typing import Dict, Any, Callable, List
import logging
from .sovereign_utils import (
    generate_sovereign_id, 
    compute_policy_integrity_hash, 
    format_sovereign_telemetry
)

# Configure logging for governance events
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SovereignEngine")

class SovereignEngine:
    """
    Core engine for managing system-wide safety and self-regulation policies.
    Maintains a registry of active constraints and enforces them during execution.
    """
    
    def __init__(self):
        self._policies: Dict[str, Any] = {}
        self._registry: Dict[str, Callable] = {}
        self._audit_trail: List[Dict[str, Any]] = []
        logger.info("Sovereign Engine Initialized.")

    def register_policy(self, name: str, enforcement_fn: Callable[[Any], bool]) -> None:
        """Registers a new safety policy into the sovereign registry."""
        self._registry[name] = enforcement_fn
        logger.info(f"Policy registered: {name}")

    def enforce(self, policy_name: str, context: Any) -> bool:
        """
        Executes a registered policy against the provided context.
        Returns True if compliant, False otherwise.
        """
        if policy_name not in self._registry:
            logger.warning(f"Attempted to enforce unregistered policy: {policy_name}")
            return False
            
        try:
            is_compliant = self._registry[policy_name](context)
            
            # Audit the enforcement action
            telemetry = format_sovereign_telemetry(
                action=f"ENFORCE_{policy_name}",
                status="COMPLIANT" if is_compliant else "VIOLATION",
                metadata={"integrity_hash": compute_policy_integrity_hash({"context": str(context)})}
            )
            self._audit_trail.append(telemetry)
            
            return is_compliant
        except Exception as e:
            logger.error(f"Policy enforcement error in {policy_name}: {str(e)}")
            return False

    def get_audit_log(self) -> List[Dict[str, Any]]:
        """Returns the current audit trail of sovereign operations."""
        return self._audit_trail

# Singleton instance for system-wide access
sovereign_controller = SovereignEngine()

def run_sovereign_check(policy_name: str, context: Any) -> bool:
    """Global helper to execute sovereign checks."""
    return sovereign_controller.enforce(policy_name, context)