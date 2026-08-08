from typing import Dict, Any, Callable, List
import logging

class KnowledgeRegistry:
    def __init__(self):
        self._data: Dict[str, Any] = {}
        self._validators: Dict[str, Callable[[Any], bool]] = {}
        self.logger = logging.getLogger('KnowledgeRegistry')

    def register(self, key: str, value: Any, validator: Callable[[Any], bool]):
        if not validator(value):
            raise ValueError(f"Validation failed for key: {key}")
        self._data[key] = value
        self._validators[key] = validator

    def get(self, key: str) -> Any:
        return self._data.get(key)

    def validate(self, key: str) -> bool:
        if key not in self._data:
            return False
        return self._validators[key](self._data[key])

    def list_keys(self) -> List[str]:
        return list(self._data.keys())

registry = KnowledgeRegistry()