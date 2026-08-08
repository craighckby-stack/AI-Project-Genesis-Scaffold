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
import time
from typing import Dict, Any

# Importing internal diagnostic engine and knowledge base components
# These modules are provided as part of the architectural evolution
try:
    from .diagnostic_engine import engine, DiagnosticResult
    from .knowledge_base import PHYSICAL_CONSTANTS, ENGINEERING_DOMAINS, verify_schemas
except ImportError as e:
    logging.error(f"Critical dependency missing: {e}")
    raise

# Configure logging for the engineering module
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _validate_knowledge_integrity() -> DiagnosticResult:
    """
    Internal check to verify the presence and consistency of core engineering schemas.
    Performs a deep-dive validation of the knowledge registry.
    """
    try:
        start_time = time.perf_counter()
        is_valid = verify_schemas()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        
        if not is_valid:
            return DiagnosticResult(
                passed=False,
                message="Engineering knowledge schemas failed validation check.",
                metadata={"status": "SCHEMA_CORRUPT", "duration_ms": duration_ms}
            )
        
        metadata = {
            "version": "1.0.0",
            "status": "READY",
            "constants_count": len(PHYSICAL_CONSTANTS),
            "domains_count": len(ENGINEERING_DOMAINS),
            "domains": list(ENGINEERING_DOMAINS.keys()),
            "duration_ms": duration_ms
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

# Register diagnostic hooks into the global engine
engine.register("integrity_check", _validate_knowledge_integrity)

def initialize_encyclopedia() -> bool:
    """
    Initializes the encyclopedia and runs the self-diagnostic suite.
    Ensures the module is ready for consumption by the AI Agent OS kernel.
    
    Returns:
        bool: True if all diagnostics passed, False otherwise.
    """
    logger.info("Initializing Encyclopedia of Engineering...")
    
    # Run the diagnostic suite via the registered engine
    report = engine.run_all()
    
    all_passed = True
    for name, result in report.items():
        passed = result.get('passed', False)
        message = result.get('message', 'No message provided')
        duration = result.get('duration_ms', 0.0)
        
        if not passed:
            logger.error(
                f"Diagnostic Failure in '{name}': {message} "
                f"(Duration: {duration}ms)"
            )
            all_passed = False
        else:
            logger.info(
                f"Diagnostic Passed: '{name}' "
                f"(Duration: {duration}ms)"
            )
            
    if all_passed:
        logger.info("Encyclopedia of Engineering successfully initialized and verified.")
    else:
        logger.warning("Encyclopedia of Engineering initialized with diagnostic warnings/failures.")
        
    return all_passed

# Execute initialization on module import to ensure readiness
if __name__ != "__main__":
    initialize_encyclopedia()

__all__ = [
    'initialize_encyclopedia',
    'engine',
    'PHYSICAL_CONSTANTS',
    'ENGINEERING_DOMAINS'
]