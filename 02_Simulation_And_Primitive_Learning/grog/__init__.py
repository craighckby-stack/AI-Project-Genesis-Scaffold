"""
GROG PRIMITIVE LEARNING MODULE
Role: Entry point for the Grog simulation and primitive learning environment.
Architecture: Implements a registry-based diagnostic initialization sequence to ensure
system integrity before simulation execution. Integrates telemetry-aware diagnostic
patterns siphoned from AI_Agent_OS.
"""

from .grog_diagnostics import initialize_grog_diagnostics

# Initialize diagnostic engine for system integrity validation
# This ensures that all primitive learning environments are verified
# against the system's diagnostic registry before execution.
diagnostic_engine = initialize_grog_diagnostics()

def run_startup_checks():
    """
    Executes the diagnostic suite to verify environment readiness.
    Returns a comprehensive report of system health and integrity.
    """
    return diagnostic_engine.run_all()

# Expose core interface for external simulation controllers
__all__ = ["run_startup_checks", "diagnostic_engine"]