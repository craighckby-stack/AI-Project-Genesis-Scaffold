from __future__ import annotations
from typing import Dict, Any, Optional

class KnowledgeRegistry:
    """Centralized registry for engineering knowledge and physical constants."""
    def __init__(self):
        self._constants: Dict[str, Dict[str, Any]] = {}
        self._domains: Dict[str, Dict[str, Any]] = {}

    def register_constant(self, name: str, value: float, unit: str, description: str):
        self._constants[name] = {"value": value, "unit": unit, "description": description}

    def register_domain(self, name: str, subfields: list, equations: Dict[str, Any]):
        self._domains[name] = {"subfields": subfields, "key_equations": equations}

    def get_constant(self, name: str) -> Optional[Dict[str, Any]]:
        return self._constants.get(name)

    def get_domain(self, name: str) -> Optional[Dict[str, Any]]:
        return self._domains.get(name)

    def validate_integrity(self) -> bool:
        return len(self._constants) > 0 and len(self._domains) > 0