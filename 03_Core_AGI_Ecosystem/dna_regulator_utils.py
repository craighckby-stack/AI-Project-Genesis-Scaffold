"""
DNA REGULATOR UTILITIES
Role: Provides validation, telemetry execution, and basic scoring for DNA sequences.
Integration: Imported by DnaRegulator to handle low-level sequence operations.
"""

from __future__ import annotations
import re
import time
from typing import Callable, Tuple, Dict, Any

def validate_dna_sequence(sequence: str) -> bool:
    """
    Validates a DNA sequence string.
    Must only contain A, C, G, T and meet minimum complexity requirements.
    """
    if not sequence or len(sequence) < 8:
        return False
    
    # Ensure only valid nucleotides
    if not re.fullmatch(r'[ACGT]+', sequence.upper()):
        return False
    
    # Basic entropy check: ensure it's not just a single repeated character
    if len(set(sequence.upper())) < 2:
        return False
        
    return True

def compute_expression_score(sequence: str) -> float:
    """
    Computes a heuristic expression score based on GC content and sequence length.
    Siphoned from basic genetic modeling patterns.
    """
    seq = sequence.upper()
    gc_count = seq.count('G') + seq.count('C')
    gc_content = gc_count / len(seq)
    
    # Expression is favored by balanced GC content (approx 0.5)
    score = 1.0 - abs(0.5 - gc_content) * 2
    return round(max(0.1, score), 4)

def execute_regulation_step(logic_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """
    Executes a regulation logic function and measures duration in milliseconds.
    Siphoned from Tessera diagnostic execution patterns.
    """
    start_time = time.perf_counter()
    try:
        result = bool(logic_fn())
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return result, round(duration_ms, 4)
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        return False, round(duration_ms, 4)
