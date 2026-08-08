"""
EVO RAG UTILITIES
Role: Provides core telemetry, validation, and diagnostic utilities for the Evo RAG ecosystem.
Integration: Used by evo_rag.py to ensure verifiable, telemetry-aware retrieval processes.
Dependencies: evo_rag_diagnostic_core.py
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, Tuple, Callable, Optional
from .evo_rag_diagnostic_core import (
    RAGDiagnosticResult, 
    validate_rag_check_function, 
    generate_rag_telemetry_metadata
)

def format_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def execute_rag_step_with_telemetry(step_fn: Callable[[], Any], step_name: str) -> Tuple[Any, float]:
    """
    Executes a RAG retrieval or processing step and measures execution duration in milliseconds.
    
    :param step_fn: Callable RAG step function.
    :param step_name: Identifier string for the step.
    :return: Tuple of (result, duration_ms).
    """
    start_time = time.perf_counter()
    try:
        result = step_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return result, round(duration_ms, 3)
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return {"error": str(e), "telemetry": generate_rag_telemetry_metadata()}, round(duration_ms, 3)

def validate_rag_schema(data: Dict[str, Any]) -> bool:
    """
    Validates that the RAG data structure conforms to expected schema requirements.
    
    :param data: The dictionary to validate.
    :return: Boolean indicating schema validity.
    """
    required_keys = {"context", "metadata"}
    return isinstance(data, dict) and all(key in data for key in required_keys)

def create_diagnostic_result(passed: bool, message: str, metadata: Optional[Dict[str, Any]] = None) -> RAGDiagnosticResult:
    """
    Factory function for creating standardized RAG diagnostic results.
    """
    full_metadata = generate_rag_telemetry_metadata()
    if metadata:
        full_metadata.update(metadata)
    return RAGDiagnosticResult(passed=passed, message=message, metadata=full_metadata)