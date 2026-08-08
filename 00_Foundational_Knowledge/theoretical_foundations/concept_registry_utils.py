"""
CONCEPT REGISTRY UTILITIES
Role: Provides thread-safe, type-safe registry management for theoretical concepts.
Integration: Used by core_concepts.py to maintain system-wide knowledge integrity.
"""

from __future__ import annotations
from typing import Dict, Any, List, Optional
import threading

class ConceptRegistry:
    def __init__(self) -> None:
        self._concepts: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()

    def register(self, name: str, definition: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        with self._lock:
            self._concepts[name] = {
                "name": name,
                "definition": definition,
                "metadata": metadata or {},
                "version": "1.0.0"
            }

    def get(self, name: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._concepts.get(name)

    def list_concepts(self) -> List[str]:
        with self._lock:
            return list(self._concepts.keys())

def validate_concept_schema(concept: Dict[str, Any]) -> bool:
    """Validates that a concept dictionary contains required fields."""
    required = {"name", "definition", "metadata"}
    return all(key in concept for key in required)
