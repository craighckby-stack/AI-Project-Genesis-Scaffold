from __future__ import annotations
from typing import Any, Dict, Callable, Optional

class KnowledgeRegistry:
    """Centralized registry for domain knowledge and schema definitions."""
    def __init__(self):
        self._registry: Dict[str, Any] = {}
        self._validators: Dict[str, Callable[[Any], bool]] = {}

    def register(self, key: str, data: Any, validator: Optional[Callable[[Any], bool]] = None):
        self._registry[key] = data
        if validator:
            self._validators[key] = validator

    def get(self, key: str) -> Any:
        return self._registry.get(key)

    def validate(self, key: str) -> bool:
        if key not in self._registry:
            return False
        if key in self._validators:
            return self._validators[key](self._registry[key])
        return True

    def list_keys(self) -> list[str]:
        return list(self._registry.keys())

registry = KnowledgeRegistry()