"""
PERSONA EVOLUTION UTILITIES
Role: Helper utilities for persona state transitions, evolution metrics, and validation logic.
Integration: Imported by persona_evolution_orchestrator.py to compute evolution delta and state integrity.
Upgraded with diagnostic telemetry and structural validation patterns from AI_Agent_OS.
"""

from __future__ import annotations
import time
import uuid
from typing import Dict, Any, Callable, Tuple, Optional
from .persona_diagnostic_core import (
    generate_evolution_telemetry, 
    validate_evolution_integrity, 
    EvolutionDiagnosticResult
)

def validate_persona_schema(persona_data: Dict[str, Any]) -> bool:
    """
    Validates that the persona dictionary contains required evolution keys 
    and passes structural integrity checks.
    """
    required_keys = {"id", "version", "traits", "evolution_history"}
    schema_valid = all(key in persona_data for key in required_keys)
    
    # Perform deep integrity check via diagnostic core
    integrity_valid = validate_evolution_integrity(persona_data)
    
    return schema_valid and integrity_valid

def compute_evolution_delta(old_state: Dict[str, Any], new_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates the delta between two persona states for audit logging.
    Includes telemetry metadata for tracking evolution performance.
    """
    telemetry = generate_evolution_telemetry()
    
    # Identify key changes
    old_keys = set(old_state.keys())
    new_keys = set(new_state.keys())
    
    delta = {
        "timestamp": telemetry.get("timestamp"),
        "version_jump": f"{old_state.get('version', '0.0.0')} -> {new_state.get('version', '0.0.0')}",
        "added_keys": list(new_keys - old_keys),
        "removed_keys": list(old_keys - new_keys),
        "telemetry": telemetry
    }
    return delta

def execute_evolution_step(step_fn: Callable[[], Dict[str, Any]]) -> Tuple[bool, Dict[str, Any]]:
    """
    Executes an evolution step with comprehensive error handling, 
    status tracking, and diagnostic telemetry integration.
    
    Returns a tuple of (success_boolean, result_payload).
    """
    start_time = time.perf_counter()
    step_id = str(uuid.uuid4())
    
    try:
        # Execute the core evolution logic
        result = step_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        
        # Enrich result with diagnostic metadata for audit compliance
        result["_diagnostic"] = {
            "step_id": step_id,
            "status": "SUCCESS",
            "duration_ms": round(duration_ms, 3),
            "telemetry": generate_evolution_telemetry()
        }
        return True, result
        
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        
        # Construct failure payload with diagnostic context
        error_payload = {
            "error": str(e),
            "step_id": step_id,
            "timestamp": time.time(),
            "_diagnostic": {
                "status": "FAILURE",
                "duration_ms": round(duration_ms, 3),
                "telemetry": generate_evolution_telemetry()
            }
        }
        return False, error_payload

def get_evolution_health_score(persona_data: Dict[str, Any]) -> float:
    """
    Computes a health score based on evolution history depth and integrity.
    Used for monitoring the stability of the persona evolution engine.
    """
    history = persona_data.get("evolution_history", [])
    if not history:
        return 0.0
    
    # Simple heuristic: ratio of valid history entries to total entries
    valid_entries = [entry for entry in history if isinstance(entry, dict) and "version" in entry]
    return len(valid_entries) / len(history)