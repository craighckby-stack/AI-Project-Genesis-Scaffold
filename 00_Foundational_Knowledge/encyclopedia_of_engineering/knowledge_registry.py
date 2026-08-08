"""
KNOWLEDGE REGISTRY
Role: Centralized, thread-safe registry for engineering knowledge, constants, and domain schemas.
Integration: Used by knowledge_base.py to manage system-wide engineering data.
Upgraded to support diagnostic telemetry and thread-safe operations.
"""

from __future__ import annotations
import threading
import time
from typing import Dict, Any, List, Optional
from .registry_types import RegistryDiagnosticResult

class KnowledgeRegistry:
    """
    A thread-safe registry for managing engineering constants and domain-specific knowledge.
    Implements diagnostic hooks to ensure data integrity during runtime.
    """
    def __init__(self) -> None:
        self._constants: Dict[str, Dict[str, Any]] = {}
        self._domains: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        self._last_updated = time.time()

    def register_constant(self, name: str, value: float, unit: str, description: str) -> None:
        """Registers a physical constant with metadata."""
        with self._lock:
            self._constants[name] = {
                "value": value, 
                "unit": unit, 
                "description": description,
                "registered_at": time.time()
            }
            self._last_updated = time.time()

    def register_domain(self, name: str, subfields: List[str], formulas: Dict[str, Any]) -> None:
        """Registers an engineering domain with its associated subfields and formulas."""
        with self._lock:
            self._domains[name] = {
                "subfields": subfields, 
                "formulas": formulas,
                "registered_at": time.time()
            }
            self._last_updated = time.time()

    def get_constant(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieves a constant by name."""
        with self._lock:
            return self._constants.get(name)

    def get_domain(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieves a domain configuration by name."""
        with self._lock:
            return self._domains.get(name)

    def validate_integrity(self) -> RegistryDiagnosticResult:
        """
        Performs a deep integrity check on the registry.
        Ensures all domains contain required schema fields and constants are populated.
        """
        with self._lock:
            try:
                for domain, data in self._domains.items():
                    if "formulas" not in data or "subfields" not in data:
                        return RegistryDiagnosticResult(
                            False, 
                            f"Domain {domain} missing required schema fields", 
                            {"domain": domain}
                        )
                
                passed = len(self._constants) > 0
                return RegistryDiagnosticResult(
                    passed, 
                    "Registry integrity verified" if passed else "Registry empty",
                    {
                        "constant_count": len(self._constants), 
                        "domain_count": len(self._domains),
                        "last_updated": self._last_updated
                    }
                )
            except Exception as e:
                return RegistryDiagnosticResult(False, str(e), {"error": "Validation exception"})

    def get_registry_state(self) -> Dict[str, Any]:
        """Exports current registry state for system auditing and telemetry."""
        with self._lock:
            return {
                "constants_count": len(self._constants),
                "domains_count": len(self._domains),
                "last_updated": self._last_updated,
                "status": "OPERATIONAL",
                "thread_safe": True
            }