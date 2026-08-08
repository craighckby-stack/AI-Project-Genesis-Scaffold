"""
DNA REGULATOR UTILITIES
Role: Helper utilities for genetic expression state management, validation, and telemetry.
Integration: Imported by dna_regulator.py to compute regulatory metrics and validate DNA sequences.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple

def validate_dna_sequence(sequence: str) -> bool:
    """Validates that a DNA sequence contains only valid base pairs (A, C, G, T)."""
    valid_bases = {'A', 'C', 'G', 'T'}
    return all(base in valid_bases for base in sequence.upper())

def compute_expression_score(sequence: str) -> float:
    """Computes a hypothetical expression score based on GC content."""
    if not sequence: return 0.0
    gc_count = sequence.upper().count('G') + sequence.upper().count('C')
    return round((gc_count / len(sequence)) * 100, 2)

def execute_regulation_step(step_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """Executes a regulatory step and measures execution duration."""
    start_time = time.perf_counter()
    try:
        passed = bool(step_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return passed, round(duration_ms, 3)
    except Exception:
        return False, 0.0
