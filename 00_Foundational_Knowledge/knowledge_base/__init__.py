"""
KNOWLEDGE BASE INITIALIZATION
Role: Core entry point for the system's foundational knowledge base.
Integration: Manages domain-specific knowledge registries and schema validation.
Dependencies: registry_utils.py (Registry management)

This module serves as the primary interface for accessing and validating 
system-wide knowledge, ensuring that all data injected into the diagnostic 
engine adheres to strict structural integrity requirements.
"""

from .registry_utils import registry

def initialize_knowledge_base():
    """
    Initializes the knowledge base registry with core domain schemas.
    This function should be called during system startup to ensure 
    all foundational data is loaded and validated.
    """
    # Example registration of domain knowledge
    registry.register(
        "system_version", 
        "1.0.0-STABLE", 
        lambda x: isinstance(x, str) and x.endswith("-STABLE")
    )
    
    # Placeholder for future domain-specific knowledge injection
    # registry.register("engineering_standards", {...})

def get_knowledge(key: str):
    """Retrieves a specific piece of knowledge from the registry."""
    return registry.get(key)

def verify_integrity() -> bool:
    """Performs a full integrity check on all registered knowledge."""
    return all(registry.validate(key) for key in registry.list_keys())

# Initialize on import
initialize_knowledge_base()

__all__ = ["registry", "get_knowledge", "verify_integrity"]