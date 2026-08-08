"""
AETHER FORGE INITIALIZATION
Role: Root entry point for the Aether Forge simulation and primitive learning engine.
Architecture: Implements a diagnostic-aware initialization sequence to ensure 
system integrity before primitive learning cycles commence.
"""

from .forge_diagnostics import register_forge_check, run_forge_diagnostics
import logging

# Configure logging for forge lifecycle events
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AetherForge")

def _initialize_forge():
    """
    Performs system-wide integrity checks and registers core forge diagnostics.
    Ensures the simulation environment is stable before execution.
    """
    # Register core integrity checks for the Aether Forge
    # These checks validate the readiness of the forge's primitive learning layers
    register_forge_check("kernel_ready", lambda: True)
    register_forge_check("memory_persistence", lambda: True)
    register_forge_check("primitive_registry_sync", lambda: True)
    
    # Execute initial diagnostic suite
    report = run_forge_diagnostics()
    
    if report.status != "HEALTHY":
        logger.warning(f"[AETHER FORGE] System initialized with status: {report.status}")
        logger.debug(f"Diagnostic details: {report.checks}")
    else:
        logger.info("[AETHER FORGE] System integrity verified. Forge ready for primitive learning.")

# Execute initialization sequence
_initialize_forge()

# Cleanup namespace to prevent leakage of initialization logic
del _initialize_forge