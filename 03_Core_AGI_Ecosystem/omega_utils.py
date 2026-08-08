"""
OMEGA ENGINE UTILITIES
Role: Helper utilities for Omega ecosystem management, state serialization, and registry orchestration.
Integration: Imported by omega.py to maintain modularity and clean execution paths.
"""

from __future__ import annotations
import time
import uuid
from typing import Dict, Any, Callable, Optional

def generate_system_id() -> str:
    """Generates a unique identifier for the Omega ecosystem instance."""
    return f"omega-{uuid.uuid4().hex[:8]}"

def get_system_metrics() -> Dict[str, Any]:
    """Returns current system performance metrics."""
    return {
        "uptime": time.process_time(),
        "timestamp": time.time(),
        "status": "OPERATIONAL"
    }

class OmegaRegistry:
    """Registry for managing AGI ecosystem components."""
    def __init__(self):
        self._components: Dict[str, Any] = {}

    def register(self, name: str, component: Any):
        self._components[name] = component

    def get(self, name: str) -> Optional[Any]:
        return self._components.get(name)

    def list_components(self) -> list[str]:
        return list(self._components.keys())
