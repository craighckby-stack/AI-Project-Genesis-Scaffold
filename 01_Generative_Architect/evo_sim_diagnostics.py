"""
EVO SIM DIAGNOSTICS
Role: Provides specialized diagnostic metrics and telemetry for evolution simulation cycles.
Integration: Imported by evo_sim_utils.py for audit-ready simulation tracking.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Tuple

def compute_evolution_metrics(state: Dict[str, Any]) -> Dict[str, float]:
    """Computes weighted fitness metrics with telemetry overhead."""
    start = time.perf_counter()
    accuracy = float(state.get('accuracy', 0.0))
    efficiency = float(state.get('efficiency', 0.0))
    fitness = (accuracy * 0.7) + (efficiency * 0.3)
    
    return {
        "fitness": fitness,
        "calc_duration_ms": round((time.perf_counter() - start) * 1000, 3),
        "timestamp": time.time()
    }

def validate_simulation_integrity(state: Dict[str, Any]) -> Tuple[bool, str]:
    """Validates that the simulation state meets schema requirements."""
    required = ['accuracy', 'efficiency']
    for key in required:
        if key not in state:
            return False, f"Missing required key: {key}"
    return True, "Validation passed"
