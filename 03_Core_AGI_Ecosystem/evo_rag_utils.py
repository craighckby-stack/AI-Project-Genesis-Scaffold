"""
EVO RAG UTILITIES
Role: Provides core telemetry, schema validation, context scoring, and diagnostic utilities for the Evo RAG ecosystem.
Integration: Used by evo_rag.py and related AGI ecosystem modules to ensure verifiable, telemetry-aware retrieval processes.
Dependencies: 03_Core_AGI_Ecosystem/evo_rag_diagnostic_core.py
"""

from __future__ import annotations
import time
import datetime
import math
from typing import Dict, Any, Tuple, Callable, Optional, List

try:
    from .evo_rag_diagnostic_core import (
        RAGDiagnosticResult, 
        validate_rag_check_function, 
        generate_rag_telemetry_metadata
    )
except ImportError:
    from evo_rag_diagnostic_core import (
        RAGDiagnosticResult, 
        validate_rag_check_function, 
        generate_rag_telemetry_metadata
    )


def format_timestamp() -> str:
    """
    Returns ISO 8601 formatted UTC timestamp with Z suffix.
    
    :return: Standardized ISO 8601 UTC timestamp string.
    """
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    return now_utc.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


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
        return {
            "error": str(e), 
            "step_name": step_name, 
            "telemetry": generate_rag_telemetry_metadata()
        }, round(duration_ms, 3)


def validate_rag_schema(data: Dict[str, Any]) -> bool:
    """
    Validates that the RAG data structure conforms to expected schema requirements.
    
    :param data: The dictionary to validate.
    :return: Boolean indicating schema validity.
    """
    required_keys = {"context", "metadata"}
    return isinstance(data, dict) and all(key in data for key in required_keys)


def create_diagnostic_result(
    passed: bool, 
    message: str, 
    metadata: Optional[Dict[str, Any]] = None
) -> RAGDiagnosticResult:
    """
    Factory function for creating standardized RAG diagnostic results.
    
    :param passed: Boolean flag indicating if the check passed.
    :param message: Diagnostic detail message.
    :param metadata: Optional key-value metadata dict.
    :return: Standardized RAGDiagnosticResult tuple.
    """
    full_metadata = generate_rag_telemetry_metadata()
    if metadata:
        full_metadata.update(metadata)
    return RAGDiagnosticResult(passed=passed, message=message, metadata=full_metadata)


def compute_context_relevance_score(retrieved_chunks: List[str], query: str) -> float:
    """
    Computes a term-overlap relevance score for RAG context verification.
    
    :param retrieved_chunks: List of text chunks retrieved from vector store.
    :param query: Natural language query string.
    :return: Float score between 0.0 and 1.0.
    """
    if not retrieved_chunks or not query.strip():
        return 0.0
    
    query_terms = set(query.lower().split())
    if not query_terms:
        return 0.0

    total_score = 0.0
    for chunk in retrieved_chunks:
        chunk_terms = set(chunk.lower().split())
        if not chunk_terms:
            continue
        overlap = query_terms.intersection(chunk_terms)
        chunk_score = len(overlap) / len(query_terms)
        total_score += chunk_score
    
    avg_score = total_score / len(retrieved_chunks)
    return round(min(1.0, max(0.0, avg_score)), 4)


def sanitize_rag_payload(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes and normalizes a RAG data payload for safe pipeline processing.
    
    :param data: Raw RAG dictionary payload.
    :return: Standardized, sanitized dictionary.
    """
    if not isinstance(data, dict):
        return {
            "context": "",
            "metadata": generate_rag_telemetry_metadata(),
            "sanitized": True
        }
    
    sanitized = dict(data)
    if "context" not in sanitized or not isinstance(sanitized["context"], str):
        sanitized["context"] = str(sanitized.get("context", ""))
        
    if "metadata" not in sanitized or not isinstance(sanitized["metadata"], dict):
        sanitized["metadata"] = {}
        
    sanitized["metadata"]["sanitized_at"] = format_timestamp()
    return sanitized


def summarize_rag_execution(metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes aggregate telemetry metrics from a list of RAG execution step telemetry dicts.
    
    :param metrics: List of telemetry step dictionaries containing step details and durations.
    :return: Aggregate metrics summary dictionary.
    """
    if not metrics:
        return {
            "total_steps": 0,
            "successful_steps": 0,
            "failed_steps": 0,
            "success_rate": 0.0,
            "avg_duration_ms": 0.0,
            "max_duration_ms": 0.0,
            "total_duration_ms": 0.0,
        }
    
    total_steps = len(metrics)
    successful_steps = sum(1 for m in metrics if "error" not in m)
    durations = [float(m.get("duration_ms", 0.0)) for m in metrics if "duration_ms" in m]
    
    total_duration = sum(durations) if durations else 0.0
    avg_duration = total_duration / len(durations) if durations else 0.0
    max_duration = max(durations) if durations else 0.0
    
    return {
        "total_steps": total_steps,
        "successful_steps": successful_steps,
        "failed_steps": total_steps - successful_steps,
        "success_rate": round((successful_steps / total_steps) * 100.0, 2),
        "avg_duration_ms": round(avg_duration, 3),
        "max_duration_ms": round(max_duration, 3),
        "total_duration_ms": round(total_duration, 3),
    }