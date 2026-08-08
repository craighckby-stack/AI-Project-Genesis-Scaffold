"""
ENCYCLOPEDIA OF ENGINEERING - CORE MODULE
=========================================
Role: Primary entry point for the engineering knowledge base.
Integration: Implements self-validating diagnostic hooks to ensure knowledge integrity.
Architecture: Employs a registry-based diagnostic pattern siphoned from AI_Agent_OS.

This module initializes the engineering knowledge base, registers diagnostic checks,
and runs a self-validation suite to guarantee that all physical constants, engineering
schemas, and equations are fully loaded and compliant before consumption by the AI Agent OS.
"""

from __future__ import annotations
import logging
from .diagnostic_engine import engine, DiagnosticResult
from .knowledge_base import PHYSICAL_CONSTANTS, ENGINEERING_DOMAINS, verify_schemas

# Configure logging for the engineering module
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _validate_knowledge_integrity() -> DiagnosticResult:
    """Internal check to verify the presence of core engineering schemas."""
    try:
        is_valid = verify_schemas()
        if not is_valid:
            return DiagnosticResult(
                passed=False,
                message="Engineering knowledge schemas failed validation check.",
                metadata={"status": "SCHEMA_CORRUPT"}
            )
        
        metadata = {
            "version": "1.0.0",
            "status": "READY",
            "constants_count": len(PHYSICAL_CONSTANTS),
            "domains_count": len(ENGINEERING_DOMAINS),
            "domains": list(ENGINEERING_DOMAINS.keys())
        }
        return DiagnosticResult(
            passed=True, 
            message="Engineering knowledge schemas and physical constants verified successfully.", 
            metadata=metadata
        )
    except Exception as e:
        return DiagnosticResult(
            passed=False,
            message=f"Exception during knowledge integrity check: {str(e)}",
            metadata={"error": str(e)}
        )

# Register diagnostic hooks
engine.register("integrity_check", _validate_knowledge_integrity)

def initialize_encyclopedia() -> bool:
    """
    Initializes the encyclopedia and runs self-diagnostic suite.
    Ensures the module is ready for consumption by the AI Agent OS.
    
    Returns:
        bool: True if all diagnostics passed, False otherwise.
    """
    logger.info("Initializing Encyclopedia of Engineering...")
    report = engine.run_all()
    
    all_passed = True
    for name, result in report.items():
        if not result.get('passed'):
            logger.error(
                f"Diagnostic Failure in '{name}': {result.get('message')} "
                f"(Duration: {result.get('duration_ms')}ms)"
            )
            all_passed = False
        else:
            logger.info(
                f"Diagnostic Passed: '{name}' "
                f"(Duration: {result.get('duration_ms')}ms)"
            )
            logger.debug(f"Metadata for '{name}': {result.get('metadata')}")
            
    if all_passed:
        logger.info("Encyclopedia of Engineering successfully initialized and verified.")
    else:
        logger.warning("Encyclopedia of Engineering initialized with diagnostic warnings/failures.")
        
    return all_passed

# Execute initialization on import
initialize_encyclopedia()

__all__ = [
    'initialize_encyclopedia',
    'engine',
    'PHYSICAL_CONSTANTS',
    'ENGINEERING_DOMAINS'
]