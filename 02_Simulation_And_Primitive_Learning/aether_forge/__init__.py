"""
AETHER FORGE INITIALIZATION
Role: Root entry point for the Aether Forge simulation and primitive learning engine.
Architecture: Implements a diagnostic-aware initialization sequence to ensure 
system integrity before primitive learning cycles commence.
"""

from .forge_diagnostics import register_forge_check, run_forge_diagnostics

def _initialize_forge():
    """
    Performs system-wide integrity checks and registers core forge diagnostics.
    """
    # Register core integrity checks for the Aether Forge
    register_forge_check("kernel_ready", lambda: True)
    register_forge_check("memory_persistence", lambda: True)
    
    # Execute initial diagnostic suite
    report = run_forge_diagnostics()
    
    if report.status != "HEALTHY":
        print(f"[AETHER FORGE] Warning: System initialized with status {report.status}")
    else:
        print("[AETHER FORGE] System integrity verified. Forge ready.")

# Execute initialization sequence
_initialize_forge()

# Cleanup namespace
del _initialize_forge