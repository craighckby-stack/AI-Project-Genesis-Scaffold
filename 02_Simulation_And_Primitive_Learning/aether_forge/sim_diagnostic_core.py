"""
SIMULATION DIAGNOSTIC CORE
Role: Core logic for simulation validation, telemetry generation, and type definitions.
Integration: Delegated from world_sim_utils.py to maintain modularity.
"""

from __future__ import annotations
import time
from typing import NamedTuple, Any, Dict, Callable

class SimulationResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

def generate_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for simulation results."""
    return {
        "timestamp": time.time(),
        "engine_version": "1.0.0-AETHER-FORGE-CORE",
        "node_id": "sim_node_01"
    }

def validate_simulation_step(func: Callable) -> bool:
    """Validates that a simulation step function is callable."""
    return callable(func)