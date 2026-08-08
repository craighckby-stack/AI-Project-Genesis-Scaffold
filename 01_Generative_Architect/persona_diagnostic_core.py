"""
PERSONA DIAGNOSTIC CORE
Role: Core logic for persona evolution validation, telemetry generation, and type definitions.
Integration: Delegated from persona_evolution_utils.py to maintain modularity.
"""

from __future__ import annotations
import time
from typing import NamedTuple, Any, Dict

class EvolutionDiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

def validate_evolution_integrity(persona_data: Dict[str, Any]) -> bool:
    """Validates internal consistency of evolution history."""
    history = persona_data.get("evolution_history", [])
    return isinstance(history, list)

def generate_evolution_telemetry() -> Dict[str, Any]:
    """Generates standard telemetry metadata for persona evolution results."""
    return {
        "timestamp": time.time(),
        "thread_id": id(time.time()),
        "version": "1.0.0-EVO-DIAGNOSTIC-AWARE"
    }
