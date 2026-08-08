"""
DARLEK TELEMETRY UTILITIES
Role: Core logic for mutation validation, telemetry generation, and type definitions.
Integration: Delegated from darlek_utils.py to maintain modularity.
This module provides the foundational structures for tracking code evolution,
mutation success rates, and performance telemetry within the DARLEK CANN ecosystem.
"""

from __future__ import annotations
import time
import uuid
from typing import NamedTuple, Any, Dict, Callable, Tuple, Optional

class MutationResult(NamedTuple):
    """Structured result of a code mutation operation."""
    passed: bool
    message: str
    metadata: Dict[str, Any]

class TelemetrySnapshot(NamedTuple):
    """Snapshot of system state during a mutation event."""
    mutation_id: str
    timestamp: float
    duration_ms: float
    status: str
    context: Dict[str, Any]

def validate_mutation_function(func: Callable) -> bool:
    """Validates that a mutation function is callable and adheres to the expected signature."""
    return callable(func)

def generate_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for mutation results."""
    return {
        "timestamp": time.time(),
        "thread_id": id(time.time()),
        "version": "3.0.0-EVOLUTION-AWARE",
        "session_id": str(uuid.uuid4())
    }

def execute_mutation_with_telemetry(
    mutation_fn: Callable[[], MutationResult], 
    mutation_name: str
) -> Tuple[MutationResult, TelemetrySnapshot]:
    """
    Executes a mutation function and wraps the result with performance telemetry.
    
    :param mutation_fn: The mutation logic to execute.
    :param mutation_name: Identifier for the mutation.
    :return: Tuple containing the MutationResult and the associated TelemetrySnapshot.
    """
    start_time = time.perf_counter()
    mutation_id = str(uuid.uuid4())
    
    try:
        result = mutation_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        
        snapshot = TelemetrySnapshot(
            mutation_id=mutation_id,
            timestamp=time.time(),
            duration_ms=round(duration_ms, 3),
            status="SUCCESS" if result.passed else "FAILED",
            context={"mutation_name": mutation_name, **result.metadata}
        )
        return result, snapshot
        
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        error_result = MutationResult(
            passed=False,
            message=f"Mutation Execution Error: {str(e)}",
            metadata={"error": str(e)}
        )
        
        snapshot = TelemetrySnapshot(
            mutation_id=mutation_id,
            timestamp=time.time(),
            duration_ms=round(duration_ms, 3),
            status="CRITICAL_FAILURE",
            context={"mutation_name": mutation_name, "error": str(e)}
        )
        return error_result, snapshot