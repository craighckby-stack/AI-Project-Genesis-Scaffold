"""
KNOWLEDGE BASE INITIALIZATION
Role: Core entry point for the system's foundational knowledge base.
Integration: Manages domain-specific knowledge registries and schema validation.
Dependencies: registry_utils.py (Registry management)

This module serves as the primary interface for accessing and validating 
system-wide knowledge, ensuring that all data injected into the diagnostic 
engine adheres to strict structural integrity requirements.
"""

import logging
from .registry_utils import registry

# Configure logging for the knowledge base module
logger = logging.getLogger(__name__)

def initialize_knowledge_base():
    """
    Initializes the knowledge base registry with core domain schemas.
    This function should be called during system startup to ensure 
    all foundational data is loaded and validated.
    """
    try:
        # Register system version with schema validation
        registry.register(
            "system_version", 
            "1.0.0-STABLE", 
            lambda x: isinstance(x, str) and x.endswith("-STABLE")
        )
        
        # Register operational mode
        registry.register(
            "operational_mode",
            "PRODUCTION",
            lambda x: x in ["DEVELOPMENT", "STAGING", "PRODUCTION"]
        )
        
        logger.info("Knowledge base initialized successfully.")
    except Exception as e:
        logger.error(f"Critical failure during knowledge base initialization: {e}")
        raise

def get_knowledge(key: str):
    """Retrieves a specific piece of knowledge from the registry."""
    return registry.get(key)

def verify_integrity() -> bool:
    """
    Performs a full integrity check on all registered knowledge.
    Returns True if all keys pass their respective validation functions.
    """
    try:
        keys = registry.list_keys()
        if not keys:
            logger.warning("Integrity check performed on empty registry.")
            return True
            
        results = {key: registry.validate(key) for key in keys}
        is_healthy = all(results.values())
        
        if not is_healthy:
            failed = [k for k, v in results.items() if not v]
            logger.error(f"Integrity check failed for keys: {failed}")
            
        return is_healthy
    except Exception as e:
        logger.error(f"Exception during integrity verification: {e}")
        return False

# Initialize on import
initialize_knowledge_base()

__all__ = ["registry", "get_knowledge", "verify_integrity", "initialize_knowledge_base"]