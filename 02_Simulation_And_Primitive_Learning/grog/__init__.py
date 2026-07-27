"""
@file 02_Simulation_And_Primitive_Learning/grog/__init__.py
@description Package initialization for the Grog learning/simulation module.
@role Acts as the entry point for primitive learning agents and simulation logic.
@integration Connects with AetherForge simulation engine and PersonaOrchestrator.
"""

__version__ = "0.1.0"

# Expose core simulation interfaces for the Grog learning environment
# These imports ensure that the package provides a clean, unified API surface
# for the higher-level EvolutionEngine and PersonaOrchestrator.

from .grog_core import GrogAgent, GrogEnvironment, LearningState

__all__ = [
    "GrogAgent",
    "GrogEnvironment",
    "LearningState",
    "__version__"
]

# Ensure internal consistency and prevent namespace leakage
def initialize_grog_module():
    """Initializes the Grog module with required simulation constants."""
    # Placeholder for future dependency injection or environment setup
    pass

initialize_grog_module()