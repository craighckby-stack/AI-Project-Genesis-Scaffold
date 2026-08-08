"""
PERSONA EVOLUTION UTILITIES
Role: Helper utilities for persona state transitions, evolution metrics, and validation logic.
Integration: Imported by persona_evolution_orchestrator.py to compute evolution delta and state integrity.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple

def validate_persona_schema(persona_data: Dict[str, Any]) -> bool:
    """Validates that the persona dictionary contains required evolution keys."""
    required_keys = {"id", "version", "traits", "evolution_history"}
    return all(key in persona_data for key in required_keys)

def compute_evolution_delta(old_state: Dict[str, Any], new_state: Dict[str, Any]) -> Dict[str, Any]:
    """Calculates the delta between two persona states for audit logging."""
    return {
        "timestamp": time.time(),
        "version_jump": f"{old_state.get('version')} -> {new_state.get('version')}",
        "delta_keys": list(set(new_state.keys()) - set(old_state.keys()))
    }

def execute_evolution_step(step_fn: Callable[[], Dict[str, Any]]) -> Tuple[bool, Dict[str, Any]]:
    """Executes an evolution step with error handling and status tracking."""
    try:
        result = step_fn()
        return True, result
    except Exception as e:
        return False, {"error": str(e), "timestamp": time.time()}
