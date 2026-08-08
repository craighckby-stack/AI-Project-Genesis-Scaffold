"""
EVO RAG UTILITIES
Role: Helper utilities for RAG retrieval, vector indexing, and evolution metrics.
Integration: Imported by evo_rag.py to compute retrieval relevance and evolution state.
"""

from __future__ import annotations
import time
from typing import Dict, Any, List, Callable, Tuple

def compute_relevance_score(query: str, document: str) -> float:
    """Simulates relevance scoring between query and document."""
    # Placeholder for actual vector similarity logic
    return 0.95

def execute_rag_step_with_telemetry(step_fn: Callable[[], Any], step_name: str) -> Tuple[Any, float]:
    """Executes a RAG step and measures execution duration in milliseconds."""
    start_time = time.perf_counter()
    try:
        result = step_fn()
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return result, round(duration_ms, 3)
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return None, round(duration_ms, 3)

def validate_rag_schema(data: Dict[str, Any]) -> bool:
    """Validates that the RAG data packet contains required fields."""
    required = ['query', 'context', 'timestamp']
    return all(k in data for k in required)
