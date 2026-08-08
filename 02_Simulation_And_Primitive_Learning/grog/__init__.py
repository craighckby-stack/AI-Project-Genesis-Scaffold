"""
GROG PRIMITIVE LEARNING MODULE
Role: Entry point for the Grog simulation and primitive learning environment.
Architecture: Implements a registry-based diagnostic initialization sequence to ensure
system integrity before simulation execution.
"""

from .grog_diagnostics import initialize_grog_diagnostics

# Initialize diagnostic engine for system integrity validation
diagnostic_engine = initialize_grog_diagnostics()

def run_startup_checks():
    """Executes the diagnostic suite to verify environment readiness."""
    return diagnostic_engine.run_all()

# Expose core interface
__all__ = ["run_startup_checks", "diagnostic_engine"]