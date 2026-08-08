"""
DARLEK UTILS: EVOLUTIONARY CONTROL ENGINE
Role: Provides core telemetry, performance measurement, and diagnostic validation 
for the DARLEK_CANN evolution engine.
Integration: Connects to the ArchitectRegistry and AI_Evo_Sim modules for 
audit-ready system evolution.
"""

from __future__ import annotations
import time
from typing import Any, Dict, Callable, Tuple, Optional
from .darlek_telemetry_utils import (
    MutationResult, 
    validate_mutation_function, 
    generate_telemetry_metadata
)

def execute_mutation_step(step_name: str, mutation_fn: Callable[[], bool]) -> Tuple[bool, float, Dict[str, Any]]:
    """
    Executes a mutation step with precise telemetry duration measurement and metadata injection.
    
    :param step_name: Identifier for the mutation step.
    :param mutation_fn: The logic to execute.
    :return: Tuple of (success_status, duration_ms, telemetry_metadata).
    """
    start = time.perf_counter()
    metadata = generate_telemetry_metadata()
    metadata["step"] = step_name
    
    try:
        if not validate_mutation_function(mutation_fn):
            raise ValueError(f"Mutation function for {step_name} is not callable.")
            
        success = mutation_fn()
        duration = (time.perf_counter() - start) * 1000
        return success, round(duration, 3), metadata
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000
        metadata["error"] = str(e)
        return False, round(duration, 3), metadata

def execute_guarded_mutation(step_name: str, mutation_fn: Callable[[], bool]) -> Dict[str, Any]:
    """
    Executes a mutation step and returns a structured MutationReport, 
    ensuring consistent audit trails for the evolution engine.
    """
    success, duration, meta = execute_mutation_step(step_name, mutation_fn)
    return {
        "step": step_name,
        "success": success,
        "duration_ms": duration,
        "metadata": meta,
        "timestamp": time.time()
    }

def get_system_metadata() -> Dict[str, Any]:
    """
    Returns comprehensive metadata for the current evolution cycle, 
    aligned with AI_Agent_OS diagnostic standards.
    """
    base_meta = generate_telemetry_metadata()
    return {
        **base_meta,
        "engine": "DARLEK_CANN_V3",
        "status": "ACTIVE",
        "system_load_factor": 1.0,
        "operational_mode": "EVOLUTIONARY_SYNTHESIS"
    }

def summarize_mutation_results(results: Dict[str, bool]) -> Dict[str, Any]:
    """
    Computes summary metrics for mutation check results.
    
    :param results: Dictionary mapping step names to boolean success results.
    :return: Summary dictionary with pass rate and health status.
    """
    total = len(results)
    passed = sum(1 for status in results.values() if status)
    return {
        "total_steps": total,
        "passed": passed,
        "failed": total - passed,
        "pass_rate": round((passed / total * 100), 2) if total > 0 else 0.0,
        "is_stable": total > 0 and passed == total,
        "generated_at": time.time()
    }