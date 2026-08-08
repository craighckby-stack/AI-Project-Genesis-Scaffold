"""
KNOWLEDGE REGISTRY
Role: Centralized, thread-safe registry for engineering knowledge, constants, and domain schemas.
Integration: Used by knowledge_base.py to manage system-wide engineering data.
Upgraded to support diagnostic telemetry, access metrics, dynamic change listeners, and thread-safe operations.
"""

from __future__ import annotations
import threading
import time
from typing import Dict, Any, List, Optional, Callable, Set
from .registry_types import RegistryDiagnosticResult

class KnowledgeRegistry:
    """
    A thread-safe registry for managing engineering constants and domain-specific knowledge.
    Implements diagnostic hooks, access telemetry, and dynamic change listeners.
    """
    def __init__(self) -> None:
        self._constants: Dict[str, Dict[str, Any]] = {}
        self._domains: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        self._last_updated = time.time()
        
        # Telemetry and access tracking
        self._constant_access_counts: Dict[str, int] = {}
        self._domain_access_counts: Dict[str, int] = {}
        self._last_accessed_constant: Dict[str, float] = {}
        self._last_accessed_domain: Dict[str, float] = {}
        
        # Thread-safe change listeners
        self._listeners: Set[Callable[[str, str, Dict[str, Any]], None]] = set()

    def register_constant(self, name: str, value: float, unit: str, description: str) -> None:
        """
        Registers a physical constant with metadata.
        Validates input parameters before registration.
        """
        if not isinstance(name, str) or not name.strip():
            raise ValueError("Constant name must be a non-empty string.")
        if not isinstance(value, (int, float)):
            raise TypeError("Constant value must be a float or integer.")
        if not isinstance(unit, str):
            raise TypeError("Constant unit must be a string.")

        with self._lock:
            payload = {
                "value": float(value), 
                "unit": unit, 
                "description": description,
                "registered_at": time.time()
            }
            self._constants[name] = payload
            self._constant_access_counts[name] = 0
            self._last_updated = time.time()
            self._notify_listeners("constant", name, payload)

    def register_domain(self, name: str, subfields: List[str], formulas: Dict[str, Any]) -> None:
        """
        Registers an engineering domain with its associated subfields and formulas.
        Validates input parameters before registration.
        """
        if not isinstance(name, str) or not name.strip():
            raise ValueError("Domain name must be a non-empty string.")
        if not isinstance(subfields, list) or not all(isinstance(s, str) for s in subfields):
            raise TypeError("Subfields must be a list of strings.")
        if not isinstance(formulas, dict):
            raise TypeError("Formulas must be a dictionary.")

        with self._lock:
            payload = {
                "subfields": list(subfields), 
                "formulas": dict(formulas),
                "registered_at": time.time()
            }
            self._domains[name] = payload
            self._domain_access_counts[name] = 0
            self._last_updated = time.time()
            self._notify_listeners("domain", name, payload)

    def get_constant(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieves a constant by name and updates access telemetry."""
        with self._lock:
            constant = self._constants.get(name)
            if constant:
                self._constant_access_counts[name] = self._constant_access_counts.get(name, 0) + 1
                self._last_accessed_constant[name] = time.time()
            return constant

    def get_domain(self, name: str) -> Optional[Dict[str, Any]]:
        """Retrieves a domain configuration by name and updates access telemetry."""
        with self._lock:
            domain = self._domains.get(name)
            if domain:
                self._domain_access_counts[name] = self._domain_access_counts.get(name, 0) + 1
                self._last_accessed_domain[name] = time.time()
            return domain

    def add_listener(self, callback: Callable[[str, str, Dict[str, Any]], None]) -> Callable[[], None]:
        """
        Registers a change listener callback.
        Returns an unsubscribe function to prevent memory leaks.
        
        Callback signature: callback(event_type: str, name: str, data: Dict[str, Any])
        """
        if not callable(callback):
            raise TypeError("Callback must be callable.")
        with self._lock:
            self._listeners.add(callback)
            
            # Return a clean unsubscribe function
            def unsubscribe():
                with self._lock:
                    self._listeners.discard(callback)
            return unsubscribe

    def _notify_listeners(self, event_type: str, name: str, data: Dict[str, Any]) -> None:
        """Dispatches update events to all registered listeners safely."""
        with self._lock:
            active_listeners = list(self._listeners)
        
        for listener in active_listeners:
            try:
                listener(event_type, name, data)
            except Exception:
                # Suppress listener exceptions to prevent registry disruption
                pass

    def search_constants(self, query: str) -> Dict[str, Dict[str, Any]]:
        """Searches registered constants by name or description (case-insensitive)."""
        query_lower = query.lower()
        results = {}
        with self._lock:
            for name, data in self._constants.items():
                if query_lower in name.lower() or query_lower in data.get("description", "").lower():
                    results[name] = data
        return results

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
                        "last_updated": self._last_updated,
                        "total_constant_accesses": sum(self._constant_access_counts.values()),
                        "total_domain_accesses": sum(self._domain_access_counts.values())
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
                "thread_safe": True,
                "telemetry": {
                    "constant_accesses": dict(self._constant_access_counts),
                    "domain_accesses": dict(self._domain_access_counts),
                    "last_accessed_constant": dict(self._last_accessed_constant),
                    "last_accessed_domain": dict(self._last_accessed_domain),
                    "active_listeners_count": len(self._listeners)
                }
            }

    def reset(self) -> None:
        """
        Resets the registry state, clearing all constants, domains, and listeners.
        Prevents memory leaks in testing or hot-reload scenarios.
        """
        with self._lock:
            self._constants.clear()
            self._domains.clear()
            self._constant_access_counts.clear()
            self._domain_access_counts.clear()
            self._last_accessed_constant.clear()
            self._last_accessed_domain.clear()
            self._listeners.clear()
            self._last_updated = time.time()