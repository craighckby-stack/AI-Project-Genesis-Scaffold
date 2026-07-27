"""
================================================================================
GOVERNANCE AND CONTROL - CORE ORCHESTRATOR
================================================================================
Role: Central hub for system-wide governance, compliance enforcement, and audit 
      chain integrity. Provides thread-safe access to policy registries and 
      diagnostic telemetry for high-concurrency AGI environments.

Connections:
- 04_Governance_And_Control/audit_chain_signatures.py (Audit Integrity)
- 04_Governance_And_Control/compliance_checker.py (Compliance Enforcement)
- 03_Core_AGI_Ecosystem/agi_kernel.py (Kernel Integration)
================================================================================
"""

import threading
import logging
from typing import Dict, Any, List

# Import siphoned architectural utilities
from .audit_chain_signatures import AuditChain
from .compliance_checker import ComplianceChecker

__version__ = "1.1.0"

# Configure diagnostic logging for the Governance ecosystem
logger = logging.getLogger("Governance_And_Control")

# Global registry for governance lifecycle management
audit_chain = AuditChain()
compliance = ComplianceChecker()

# Thread-safe initialization lock
_init_lock = threading.RLock()
_is_initialized = False

__all__ = [
    "initialize_governance",
    "get_governance_status",
    "audit_chain",
    "compliance",
    "__version__"
]

def initialize_governance() -> bool:
    """
    Orchestrates the initialization of all governance sub-modules.
    Ensures audit chains and compliance checkers are ready for enforcement.
    """
    global _is_initialized
    with _init_lock:
        if _is_initialized:
            return True
            
        try:
            logger.info("Initializing Governance and Control components...")
            audit_chain.initialize()
            compliance.initialize()
            _is_initialized = True
            return True
        except Exception as e:
            logger.error(f"Critical failure during governance initialization: {e}")
            return False

def get_governance_status() -> Dict[str, Any]:
    """
    Returns the current operational status of the governance components.
    """
    return {
        "version": __version__,
        "status": "OPERATIONAL" if _is_initialized else "PENDING",
        "components": ["AuditChain", "ComplianceChecker"]
    }

# Execute self-check on import
if __name__ == "__main__":
    initialize_governance()