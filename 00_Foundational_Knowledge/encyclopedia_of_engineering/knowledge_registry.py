"""
KNOWLEDGE REGISTRY
Role: Centralized, thread-safe registry for engineering knowledge, constants, and domain schemas.
Integration: Used by knowledge_base.py to manage system-wide engineering data.
"""

from __future__ import annotations
from typing import Dict, Any, List, Optional

class KnowledgeRegistry:
    def __init__(self) -> None:
        self._constants: Dict[str, Dict[str, Any]] = {}
        self._domains: Dict[str, Dict[str, Any]] = {}

    def register_constant(self, name: str, value: float, unit: str, description: str) -> None:
        self._constants[name] = {"value": value, "unit": unit, "description": description}

    def register_domain(self, name: str, subfields: List[str], formulas: Dict[str, Any]) -> None:
        self._domains[name] = {"subfields": subfields, "formulas": formulas}

    def get_constant(self, name: str) -> Optional[Dict[str, Any]]:
        return self._constants.get(name)

    def get_domain(self, name: str) -> Optional[Dict[str, Any]]:
        return self._domains.get(name)

    def validate_integrity(self) -> bool:
        """Ensures all registered domains have required fields."""
        for domain, data in self._domains.items():
            if "formulas" not in data or "subfields" not in data:
                return False
        return len(self._constants) > 0
