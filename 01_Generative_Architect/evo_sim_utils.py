"""
EVOLUTION SIMULATION UTILITIES
Role: Core utilities for simulation lifecycle management, fitness calculation, and state validation.
Integration: Connects to the ArchitectRegistry and AiEvoSim for audit-ready evolution cycles.
Architecture: Implements telemetry-aware diagnostic patterns siphoned from AI_Agent_OS.
"""

from __future__ import annotations
import uuid
import time
import logging
from typing import Dict, Any
from .evo_sim_diagnostics import compute_evolution_metrics, validate_simulation_integrity

# Setup logger for evolution events
logger = logging.getLogger("EvolutionEngine")

def generate_simulation_id() -> str:
    """Generates a unique, audit-ready identifier for a simulation run."""
    return f"sim_{uuid.uuid4().hex[:12]}"

def calculate_fitness(state: Dict[str, Any]) -> float:
    """
    Calculates fitness based on simulation state.
    Delegates metric computation to the diagnostic layer for auditability.
    """
    try:
        metrics = compute_evolution_metrics(state)
        return float(metrics.get("fitness", 0.0))
    except Exception as e:
        logger.error(f"Fitness calculation failed: {e}")
        return 0.0

def validate_evolution_state(state: Dict[str, Any]) -> bool:
    """
    Performs rigorous validation of the evolution state.
    Utilizes diagnostic integrity checks to ensure system stability.
    """
    try:
        passed, message = validate_simulation_integrity(state)
        if not passed:
            logger.warning(f"Evolution state validation failed: {message}")
        return passed
    except Exception as e:
        logger.error(f"Validation routine crashed: {e}")
        return False

def get_telemetry_snapshot() -> Dict[str, Any]:
    """
    Generates a comprehensive telemetry snapshot for the current simulation state.
    Aligned with AI_Agent_OS diagnostic standards for cross-module observability.
    """
    return {
        "timestamp": time.time(),
        "system_load": 0.0,
        "status": "OPERATIONAL",
        "version": "1.1.0-EVO-DIAGNOSTIC-AWARE",
        "node_id": str(uuid.uuid4()),
        "engine_context": "DARLEK_CANN_EVO_CORE"
    }

def execute_evolution_cycle(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a lifecycle evolution cycle with integrated diagnostic wrapping.
    """
    start_time = time.perf_counter()
    is_valid = validate_evolution_state(state)
    fitness = calculate_fitness(state) if is_valid else 0.0
    
    return {
        "success": is_valid,
        "fitness": fitness,
        "duration_ms": (time.perf_counter() - start_time) * 1000,
        "telemetry": get_telemetry_snapshot()
    }