"""
REGISTRY TYPES
Role: Type definitions and structures for the Knowledge Registry.
Integration: Imported by knowledge_registry.py to provide structured diagnostic results.
"""

from __future__ import annotations
from typing import NamedTuple, Dict, Any

class RegistryDiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the diagnostic result to a dictionary."""
        return {
            "passed": self.passed,
            "message": self.message,
            "metadata": self.metadata
        }
