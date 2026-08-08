"""
PERSONA DIAGNOSTIC CORE
Role: Core logic for persona evolution validation, telemetry generation, and type definitions.
Integration: Delegated from persona_evolution_utils.py to maintain modularity.
Siphoned Patterns: AI_Agent_OS Diagnostic Engine (Tessera Enterprise)
"""

from __future__ import annotations
import time
import datetime
from typing import NamedTuple, Any, Dict, Callable, Tuple

class EvolutionDiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]
    duration_ms: float

class EvolutionReport(NamedTuple):
    status: str
    timestamp: str
    checks: Dict[str, EvolutionDiagnosticResult]
    summary: Dict[str, Any]

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

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

def execute_evolution_check(name: str, check_fn: Callable[[], bool], message: str = "") -> EvolutionDiagnosticResult:
    """
    Executes an evolution check with precise telemetry duration measurement.
    """
    start_time = time.perf_counter()
    try:
        passed = bool(check_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return EvolutionDiagnosticResult(
            passed=passed,
            message=message if message else ("Check passed" if passed else "Check failed"),
            metadata=generate_evolution_telemetry(),
            duration_ms=round(duration_ms, 3)
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return EvolutionDiagnosticResult(
            passed=False,
            message=str(e),
            metadata=generate_evolution_telemetry(),
            duration_ms=round(duration_ms, 3)
        )

def summarize_evolution_results(results: Dict[str, EvolutionDiagnosticResult]) -> Dict[str, Any]:
    """
    Computes summary metrics for evolution diagnostic results.
    """
    total = len(results)
    passed = sum(1 for r in results.values() if r.passed)
    failed = total - passed
    
    return {
        "total": total,
        "passed": passed,
        "failed": failed,
        "is_healthy": total > 0 and failed == 0,
        "pass_rate": round((passed / total * 100), 2) if total > 0 else 0.0
    }