"""
KNOWLEDGE REGISTRY UTILS
Role: Centralized, thread-safe registry for domain-specific knowledge.
Integration: Acts as the primary interface for knowledge persistence and validation.
Architecture: Aligned with AI_Agent_OS diagnostic patterns.
"""

from __future__ import annotations
import logging
import threading
from typing import Dict, Any, Callable, List, Optional
from .registry_diagnostics import generate_registry_telemetry

class KnowledgeRegistry:
    """
    Thread-safe registry for managing knowledge base entries with 
    integrated validation and diagnostic telemetry.
    """
    def __init__(self):
        self._data: Dict[str, Any] = {}
        self._validators: Dict[str, Callable[[Any], bool]] = {}
        self._lock = threading.RLock()
        self.logger = logging.getLogger('KnowledgeRegistry')

    def register(self, key: str, value: Any, validator: Callable[[Any], bool]) -> None:
        """Registers a new knowledge entry with a mandatory validation function."""
        with self._lock:
            if not validator(value):
                self.logger.error(f"Validation failed for key: {key}")
                raise ValueError(f"Validation failed for key: {key}")
            
            self._data[key] = value
            self._validators[key] = validator
            self.logger.info(f"Successfully registered key: {key}")

    def get(self, key: str) -> Optional[Any]:
        """Retrieves a value by key."""
        with self._lock:
            return self._data.get(key)

    def validate(self, key: str) -> bool:
        """Performs an integrity check on a specific registry key."""
        with self._lock:
            if key not in self._data:
                return False
            try:
                return self._validators[key](self._data[key])
            except Exception as e:
                self.logger.error(f"Integrity check error for {key}: {e}")
                return False

    def list_keys(self) -> List[str]:
        """Returns a list of all registered keys."""
        with self._lock:
            return list(self._data.keys())

    def get_diagnostic_report(self) -> Dict[str, Any]:
        """Exports current registry state for system-wide auditing."""
        with self._lock:
            return {
                "keys": self.list_keys(),
                "telemetry": generate_registry_telemetry(len(self._data), len(self._validators))
            }

# Global registry instance
registry = KnowledgeRegistry()