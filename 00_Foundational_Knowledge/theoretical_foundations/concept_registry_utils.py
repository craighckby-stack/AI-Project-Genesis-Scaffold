"""
CONCEPT REGISTRY UTILITIES
Role: Helper utilities for managing theoretical concept definitions, validation, and registry state.
Integration: Imported by core_concepts.py to manage the lifecycle of theoretical knowledge.
"""

from __future__ import annotations
from typing import Dict, Any, Callable, Optional

class ConceptRegistry:
    """Registry for managing core theoretical concepts with schema validation."""
    def __init__(self) -> None:
        self._registry: Dict[str, Dict[str, Any]] = {}

    def register(self, name: str, definition: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        self._registry[name] = {
            "definition": definition,
            "metadata": metadata or {},
            "version": "1.0.0"
        }

    def get(self, name: str) -> Optional[Dict[str, Any]]:
        return self._registry.get(name)

    def list_concepts(self) -> list[str]:
        return list(self._registry.keys())

def validate_concept_schema(data: Dict[str, Any]) -> bool:
    """Validates that a concept entry contains required fields."""
    required = ["definition", "version"]
    return all(key in data for key in required)
