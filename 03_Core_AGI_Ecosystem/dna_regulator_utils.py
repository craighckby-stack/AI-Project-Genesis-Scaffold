"""
DNA REGULATOR UTILITIES
Role: Helper utilities for genetic expression state management, validation, and telemetry.
Integration: Imported by dna_regulator.py to compute regulatory metrics and validate DNA sequences.
Architectural Note: Now integrated with DNA Regulator Diagnostics for audit-ready telemetry.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable, Tuple, NamedTuple
from .dna_regulator_diagnostics import (
    format_timestamp,
    summarize_regulatory_results,
    execute_regulatory_check_with_telemetry
)

class RegulatoryResult(NamedTuple):
    passed: bool
    message: str
    metadata: Dict[str, Any]
    duration_ms: float

def validate_dna_sequence(sequence: str) -> bool:
    """Validates that a DNA sequence contains only valid base pairs (A, C, G, T)."""
    if not isinstance(sequence, str):
        return False
    valid_bases = {'A', 'C', 'G', 'T'}
    return all(base in valid_bases for base in sequence.upper())

def compute_expression_score(sequence: str) -> float:
    """Computes a hypothetical expression score based on GC content."""
    if not sequence: 
        return 0.0
    seq = sequence.upper()
    gc_count = seq.count('G') + seq.count('C')
    return round((gc_count / len(seq)) * 100, 2)

def execute_regulation_step(step_fn: Callable[[], bool], step_name: str) -> RegulatoryResult:
    """
    Executes a regulatory step and measures execution duration with telemetry.
    Returns a structured RegulatoryResult.
    """
    passed, duration_ms = execute_regulatory_check_with_telemetry(step_fn, step_name)
    
    return RegulatoryResult(
        passed=passed,
        message=f"Step '{step_name}' completed with status: {'SUCCESS' if passed else 'FAILURE'}",
        metadata={
            "step_name": step_name,
            "timestamp": format_timestamp(),
            "version": "1.0.0-DNA-REGULATOR-AWARE"
        },
        duration_ms=duration_ms
    )

def generate_regulatory_report(results: Dict[str, bool]) -> Dict[str, Any]:
    """Generates a comprehensive regulatory report summary."""
    summary = summarize_regulatory_results(results)
    return {
        "report_id": f"REG-{int(time.time())}",
        "timestamp": format_timestamp(),
        "summary": summary,
        "details": results
    }