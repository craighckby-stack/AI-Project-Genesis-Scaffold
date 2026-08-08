"""
EVO RAG DIAGNOSTIC CORE
Role: Core logic for RAG validation, telemetry generation, and type definitions.
Integration: Delegated from evo_rag_utils.py to maintain modularity.
"""

from __future__ import annotations
import time
from typing import NamedTuple, Any, Dict, Callable

class RAGDiagnosticResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]

def validate_rag_check_function(func: Callable) -> bool:
    """Validates that a RAG check function is callable."""
    return callable(func)

def generate_rag_telemetry_metadata() -> Dict[str, Any]:
    """Generates standard telemetry metadata for RAG diagnostic results."""
    return {
        "timestamp": time.time(),
        "system_id": "EVO_RAG_CORE",
        "version": "1.0.0-TELEMETRY-AWARE"
    }