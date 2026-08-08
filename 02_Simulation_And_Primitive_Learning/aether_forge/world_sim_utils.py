"""
WORLD SIMULATION UTILITIES
Role: Helper utilities for simulation state management, environment telemetry, and metric computation.
Integration: Imported by world_simulation_platform.py to compute simulation metrics cleanly.
Upgraded to support diagnostic-aware telemetry and audit-ready execution tracking.
"""

from __future__ import annotations
import time
import uuid
from typing import Dict, Any, Tuple, Callable, NamedTuple, Optional
from .sim_diagnostic_core import generate_telemetry_metadata, SimulationResult

class SimulationReport(NamedTuple):
    """Structured report for simulation health and performance."""
    session_id: str
    status: str
    timestamp: str
    metrics: Dict[str, Any]
    telemetry: Dict[str, Any]

def generate_simulation_id() -> str:
    """Generates a unique simulation session identifier."""
    return f"sim_{uuid.uuid4().hex[:8]}"

def compute_simulation_health(metrics: Dict[str, float]) -> bool:
    """Determines if the simulation environment is within acceptable parameters."""
    # Stability threshold defined by Aether Forge core requirements
    return metrics.get("stability", 0.0) > 0.85

def execute_step_with_telemetry(step_fn: Callable[[], Any]) -> Tuple[bool, float, Any, Dict[str, Any]]:
    """
    Executes a simulation step and measures execution duration in milliseconds.
    Returns a tuple containing success status, duration, result/error, and telemetry metadata.
    """
    start_time = time.perf_counter()
    metadata = generate_telemetry_metadata()
    
    try:
        result = step_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return True, round(duration_ms, 3), result, metadata
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return False, round(duration_ms, 3), str(e), metadata

def create_simulation_report(step_name: str, success: bool, duration: float, error: Optional[str] = None) -> SimulationResult:
    """
    Constructs a structured simulation result for audit logging.
    """
    return SimulationResult(
        passed=success,
        message=f"Step '{step_name}' completed successfully" if success else f"Step '{step_name}' failed: {error}",
        metadata={
            "step_name": step_name,
            "duration_ms": duration,
            "timestamp": time.time()
        }
    )

def generate_full_simulation_report(session_id: str, metrics: Dict[str, Any]) -> SimulationReport:
    """
    Generates a comprehensive audit-ready simulation report.
    """
    return SimulationReport(
        session_id=session_id,
        status="HEALTHY" if compute_simulation_health(metrics) else "DEGRADED",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        metrics=metrics,
        telemetry=generate_telemetry_metadata()
    )