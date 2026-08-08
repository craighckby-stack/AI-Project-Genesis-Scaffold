"""
ETHICAL REASONING ENGINE UTILITIES
Role: Helper utilities for ethical alignment, reasoning state tracking, and validation metrics.
Integration: Delegated from ethical_reasoning_engine.py to maintain modularity.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, NamedTuple

class EthicalAlignmentResult(NamedTuple):
    passed: bool
    score: float
    reasoning: str
    metadata: Dict[str, Any]

def calculate_alignment_score(factors: Dict[str, float]) -> float:
    """Computes a normalized alignment score based on weighted ethical factors."""
    if not factors: return 0.0
    return sum(factors.values()) / len(factors)

def generate_reasoning_metadata() -> Dict[str, Any]:
    """Generates standard metadata for reasoning audit trails."""
    return {
        "timestamp": time.time(),
        "engine_version": "1.0.0-ETHICAL-CORE",
        "validation_mode": "strict"
    }

def validate_ethical_constraint(constraint_fn: Callable) -> bool:
    """Validates that an ethical constraint function is properly defined."""
    return callable(constraint_fn)
