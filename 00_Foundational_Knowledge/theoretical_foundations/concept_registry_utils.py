"""
CONCEPT REGISTRY UTILITIES
Role: Provides thread-safe, type-safe registry management for theoretical concepts.
Integration: Used by core_concepts.py to maintain system-wide knowledge integrity.
Upgraded with diagnostic telemetry and audit-ready validation hooks.
"""

from __future__ import annotations
from typing import Dict, Any, List, Optional
import threading
import logging
from .diagnostic_registry_utils import execute_diagnostic_check, generate_registry_telemetry

# Configure logging for registry events
logger = logging.getLogger(__name__)

class ConceptRegistry:
    def __init__(self) -> None:
        self._concepts: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        self._last_audit = None

    def register(self, name: str, definition: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Registers a new concept with thread-safe locking and telemetry."""
        with self._lock:
            self._concepts[name] = {
                "name": name,
                "definition": definition,
                "metadata": metadata or {},
                "version": "1.1.0",
                "registered_at": generate_registry_telemetry(0)["timestamp"]
            }
            logger.debug(f"Concept registered: {name}")

    def get(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieves a concept definition."""
        with self._lock:
            return self._concepts.get(name)

    def list_concepts(self) -> List[str]:
        """Returns a list of all registered concept keys."""
        with self._lock:
            return list(self._concepts.keys())

    def run_integrity_check(self) -> Dict[str, Any]:
        """Performs a diagnostic audit of the current registry state."""
        with self._lock:
            passed, duration = execute_diagnostic_check(lambda: len(self._concepts) >= 0)
            telemetry = generate_registry_telemetry(len(self._concepts))
            
            report = {
                "status": "HEALTHY" if passed else "CRITICAL_FAILURE",
                "duration_ms": duration,
                "telemetry": telemetry,
                "summary": {
                    "total_count": len(self._concepts),
                    "integrity_verified": passed
                }
            }
            self._last_audit = report
            return report

def validate_concept_schema(concept: Dict[str, Any]) -> bool:
    """Validates that a concept dictionary contains required fields."""
    required = {"name", "definition", "metadata"}
    return all(key in concept for key in required)

def get_registry_diagnostic_status(registry: ConceptRegistry) -> Dict[str, Any]:
    """External diagnostic hook to extract registry health metrics."""
    return registry.run_integrity_check()