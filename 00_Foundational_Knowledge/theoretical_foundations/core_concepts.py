"""
CORE CONCEPTS
=============

PURPOSE:
    Core theoretical concepts underpinning the whole system.
    Acts as the central registry for foundational domain knowledge, 
    ensuring consistency across the diagnostic and knowledge-base layers.

ROLE:
    Provides a structured, queryable interface for system-wide theoretical definitions.
    Connects with the diagnostic engine to validate integrity of knowledge schemas.

INTEGRATION:
    Imports: concept_registry_utils.py (Registry management)
"""

from __future__ import annotations
from typing import Dict, Any, Optional
from .concept_registry_utils import ConceptRegistry, validate_concept_schema

# Initialize the global registry for core concepts
_registry = ConceptRegistry()

def initialize_core_concepts() -> None:
    """
    Initializes the system with foundational theoretical concepts.
    This acts as the single source of truth for system theory.
    """
    _registry.register(
        name="System_Integrity",
        definition="The state of a system where all components operate within defined parameters.",
        metadata={"critical": True, "domain": "Foundational"}
    )
    _registry.register(
        name="Diagnostic_Telemetry",
        definition="Real-time measurement of system health and performance metrics.",
        metadata={"critical": True, "domain": "Telemetry"}
    )

def get_concept(name: str) -> Optional[Dict[str, Any]]:
    """Retrieves a concept definition from the registry."""
    return _registry.get(name)

def register_new_concept(name: str, definition: str, metadata: Optional[Dict[str, Any]] = None) -> None:
    """Registers a new concept into the core theoretical framework."""
    _registry.register(name, definition, metadata)

def verify_registry_integrity() -> bool:
    """Validates the integrity of all registered concepts."""
    for name in _registry.list_concepts():
        concept = _registry.get(name)
        if not concept or not validate_concept_schema(concept):
            return False
    return True

# Perform initial registration
initialize_core_concepts()