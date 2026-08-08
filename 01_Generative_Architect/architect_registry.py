"""
ARCHITECT REGISTRY
Role: Manages architectural component registration, validation, and system health telemetry.
Integration: Initialized by the package root to ensure system-wide architectural integrity.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, List, Optional

class ArchitectRegistry:
    def __init__(self) -> None:
        self._registry: Dict[str, Callable[[], bool]] = {}
        self._telemetry: List[Dict[str, Any]] = []

    def register_component(self, name: str, validator: Callable[[], bool]) -> None:
        self._registry[name] = validator

    def run_diagnostics(self) -> Dict[str, Any]:
        results = {}
        for name, validator in self._registry.items():
            start = time.perf_counter()
            try:
                passed = validator()
                duration = (time.perf_counter() - start) * 1000
                results[name] = {"passed": passed, "duration_ms": round(duration, 3)}
            except Exception:
                results[name] = {"passed": False, "duration_ms": 0.0}
        
        return {
            "status": "HEALTHY" if all(r["passed"] for r in results.values()) else "DEGRADED",
            "timestamp": time.time(),
            "results": results
        }

# Global singleton instance
architect_registry = ArchitectRegistry()