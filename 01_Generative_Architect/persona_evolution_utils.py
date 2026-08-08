"""
PERSONA EVOLUTION UTILITIES
Role: Helper utilities for persona state transitions, evolution metrics, and validation logic.
Integration: Imported by persona_evolution_orchestrator.py to compute evolution delta and state integrity.
Upgraded with diagnostic telemetry and structural validation patterns from AI_Agent_OS.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple
from .persona_diagnostic_core import (
    generate_evolution_telemetry, 
    validate_evolution_integrity, 
    EvolutionDiagnosticResult
)

def validate_persona_schema(persona_data: Dict[str, Any]) -> bool:
    """Validates that the persona dictionary contains required evolution keys."""
    required_keys = {"id", "version", "traits", "evolution_history"}
    schema_valid = all(key in persona_data for key in required_keys)
    integrity_valid = validate_evolution_integrity(persona_data)
    return schema_valid and integrity_valid

def compute_evolution_delta(old_state: Dict[str, Any], new_state: Dict[str, Any]) -> Dict[str, Any]:
    """Calculates the delta between two persona states for audit logging with telemetry."""
    telemetry = generate_evolution_telemetry()
    delta = {
        "timestamp": telemetry["timestamp"],
        "version_jump": f"{old_state.get('version')} -> {new_state.get('version')}",
        "delta_keys": list(set(new_state.keys()) - set(old_state.keys())),
        "telemetry": telemetry
    }
    return delta

def execute_evolution_step(step_fn: Callable[[], Dict[str, Any]]) -> Tuple[bool, Dict[str, Any]]:
    """
    Executes an evolution step with error handling, status tracking, 
    and diagnostic telemetry integration.
    """
    start_time = time.perf_counter()
    try:
        result = step_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        
        # Enrich result with diagnostic metadata
        result["_diagnostic"] = {
            "status": "SUCCESS",
            "duration_ms": round(duration_ms, 3),
            "telemetry": generate_evolution_telemetry()
        }
        return True, result
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        error_payload = {
            "error": str(e),
            "timestamp": time.time(),
            "_diagnostic": {
                "status": "FAILURE",
                "duration_ms": round(duration_ms, 3),
                "telemetry": generate_evolution_telemetry()
            }
        }
        return False, error_payload