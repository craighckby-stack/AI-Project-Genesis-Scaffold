"""
OMEGA ENGINE UTILITIES
Role: Helper utilities for Omega ecosystem management, state serialization, and registry orchestration.
Integration: Imported by omega.py to maintain modularity and clean execution paths.
Upgraded with diagnostic telemetry and validation patterns from AI_Agent_OS.
"""

from __future__ import annotations
import time
import uuid
from typing import Dict, Any, Callable, Optional
from .omega_diagnostic_core import OmegaDiagnosticResult, generate_omega_telemetry
from .omega_telemetry_utils import format_omega_timestamp, summarize_omega_results, execute_omega_check

def generate_system_id() -> str:
    """Generates a unique identifier for the Omega ecosystem instance."""
    return f"omega-{uuid.uuid4().hex[:8]}"

def get_system_metrics() -> Dict[str, Any]:
    """Returns current system performance metrics with telemetry integration."""
    return {
        "uptime": time.process_time(),
        "timestamp": format_omega_timestamp(),
        "status": "OPERATIONAL",
        "telemetry": generate_omega_telemetry()
    }

class OmegaRegistry:
    """Registry for managing AGI ecosystem components with diagnostic tracking."""
    def __init__(self):
        self._components: Dict[str, Any] = {}
        self._registry_id = generate_system_id()

    def register(self, name: str, component: Any):
        """Registers a component into the Omega ecosystem."""
        self._components[name] = component

    def get(self, name: str) -> Optional[Any]:
        """Retrieves a component by name."""
        return self._components.get(name)

    def list_components(self) -> list[str]:
        """Returns a list of all registered component keys."""
        return list(self._components.keys())

    def run_health_check(self) -> Dict[str, Any]:
        """Executes diagnostic suite across all registered components."""
        results = {}
        for name, component in self._components.items():
            passed, duration = execute_omega_check(lambda: component is not None)
            results[name] = passed
        
        summary = summarize_omega_results(results)
        return {
            "summary": summary,
            "details": results,
            "timestamp": format_omega_timestamp()
        }