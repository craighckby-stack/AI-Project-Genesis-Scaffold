"""
EVO RAG DIAGNOSTIC CORE
Role: Defines the core diagnostic data structures, validation rules, and telemetry metadata generators for Evo RAG.
Integration: Imported by evo_rag_utils.py and evo_rag.py for retrieval diagnostics and health auditing.
"""

from __future__ import annotations
import time
import datetime
from typing import NamedTuple, Dict, Any, Callable


class RAGDiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]


def validate_rag_check_function(func: Callable) -> bool:
    """Validates that a diagnostic check target is a callable object."""
    return callable(func)


def generate_rag_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for RAG diagnostic execution."""
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    return {
        "timestamp": now_utc.isoformat(),
        "timestamp_epoch": time.time(),
        "perf_counter": time.perf_counter(),
        "version": "1.0.0-EVO-RAG",
        "telemetry_source": "evo_rag_diagnostic_core"
    }


def summarize_rag_diagnostics(results: Dict[str, RAGDiagnosticResult]) -> Dict[str, Any]:
    """
    Summarizes a dictionary of RAG diagnostic results into overall system health metrics.
    
    :param results: Dictionary mapping check names to RAGDiagnosticResult tuples.
    :return: Summary metrics dict with total, passed, failed, pass_rate, and health status.
    """
    total = len(results)
    if total == 0:
        return {
            "total_checks": 0,
            "passed_checks": 0,
            "failed_checks": 0,
            "pass_rate": 0.0,
            "is_healthy": True
        }
    
    passed = sum(1 for res in results.values() if res.passed)
    failed = total - passed
    pass_rate = round((passed / total) * 100.0, 2)
    
    return {
        "total_checks": total,
        "passed_checks": passed,
        "failed_checks": failed,
        "pass_rate": pass_rate,
        "is_healthy": failed == 0
    }
