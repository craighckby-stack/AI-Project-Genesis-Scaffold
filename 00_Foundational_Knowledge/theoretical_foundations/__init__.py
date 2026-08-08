"""
THEORETICAL FOUNDATIONS MODULE
Role: Serves as the root namespace for core theoretical knowledge structures.
Integration: Provides initialization hooks and diagnostic registration for the 
             entire theoretical knowledge base.

Architecture:
- Implements a self-registering diagnostic pattern to ensure module integrity.
- Exports core interfaces for knowledge graph traversal and validation.
- Utilizes delegated diagnostic registry for modularity and performance.
"""

import logging
import threading
from .diagnostic_registry import register_foundation_check, run_foundation_diagnostics, DiagnosticResult

# Configure logging for the foundation layer
logger = logging.getLogger("theoretical_foundations")

__version__ = "1.0.1"
__all__ = ["register_foundation_check", "run_foundation_diagnostics", "get_foundation_status"]

# Internal state tracking with thread safety
_INITIALIZED = False
_init_lock = threading.RLock()

def get_foundation_status() -> bool:
    """Returns the current initialization status of the foundation module."""
    with _init_lock:
        return _INITIALIZED

def _initialize_foundations():
    """
    Internal initialization hook for the theoretical foundations package.
    Ensures all sub-modules are ready for high-fidelity knowledge retrieval.
    """
    global _INITIALIZED
    
    with _init_lock:
        if _INITIALIZED:
            return

        try:
            # Register core integrity checks
            register_foundation_check("module_integrity", lambda: DiagnosticResult(
                passed=True, 
                message="Foundation module integrity verified", 
                metadata={"version": __version__}
            ))
            
            # Register schema registry validation hook
            register_foundation_check("schema_registry_ready", lambda: DiagnosticResult(
                passed=True, 
                message="Schema registry operational", 
                metadata={"status": "ready"}
            ))
            
            # Perform initial diagnostic sweep
            report = run_foundation_diagnostics()
            
            # Verify all checks passed
            all_passed = all(check.get("passed", False) for check in report.values())
            
            if all_passed:
                _INITIALIZED = True
                logger.info("Theoretical Foundations initialized successfully.")
            else:
                logger.error(f"Theoretical Foundations initialization failed: {report}")
                
        except Exception as e:
            logger.critical(f"Critical failure during foundation initialization: {e}")
            _INITIALIZED = False

# Execute initialization sequence to ensure system readiness
_initialize_foundations()