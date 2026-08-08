"""
DNA REGULATOR UTILITIES
Role: Provides high-integrity validation, telemetry execution, and heuristic scoring for DNA sequences.
Integration: Imported by DnaRegulator to handle low-level sequence operations and genetic analysis.
Dependencies: dna_complexity_engine.py, dna_telemetry_provider.py, dna_sequence_ops.py
"""

from __future__ import annotations
import re
from typing import Callable, Tuple, Dict, Any

# Internal Delegation Imports
from .dna_complexity_engine import calculate_shannon_entropy, calculate_gc_skew
from .dna_telemetry_provider import capture_execution_telemetry
from .dna_sequence_ops import normalize_sequence

def validate_dna_sequence(sequence: str) -> bool:
    """
    Validates a DNA sequence string using regex and entropy thresholds.
    Must only contain A, C, G, T and meet minimum complexity requirements.
    
    :param sequence: The DNA sequence string to validate.
    :return: True if valid, False otherwise.
    """
    if not sequence:
        return False
        
    clean_seq = normalize_sequence(sequence)
    
    # 1. Length Constraint
    if len(clean_seq) < 8:
        return False
    
    # 2. Nucleotide Integrity (Regex)
    if not re.fullmatch(r'[ACGT]+', clean_seq):
        return False
    
    # 3. Entropy Check (Complexity Guard)
    # Prevents low-entropy sequences like "AAAAAAAA" or "ATATATAT"
    entropy = calculate_shannon_entropy(clean_seq)
    if entropy < 1.0:  # Minimum threshold for functional complexity
        return False
        
    return True

def compute_expression_score(sequence: str) -> float:
    """
    Computes a multi-factor heuristic expression score based on GC content, 
    GC skew, and sequence length.
    
    :param sequence: The DNA sequence to score.
    :return: A float between 0.1 and 1.0 representing regulatory influence.
    """
    if not sequence:
        return 0.1
        
    seq = normalize_sequence(sequence)
    length = len(seq)
    
    # Factor 1: GC Content Balance (Ideal range ~0.5)
    gc_count = seq.count('G') + seq.count('C')
    gc_content = gc_count / length
    gc_balance_score = 1.0 - abs(0.5 - gc_content) * 2
    
    # Factor 2: GC Skew (Regulatory Directionality)
    # High absolute skew can indicate specific regulatory motifs
    skew = abs(calculate_gc_skew(seq))
    skew_modifier = 1.0 + (skew * 0.2)  # Slight boost for high-skew regions
    
    # Factor 3: Length Scaling
    # Longer sequences provide more regulatory context up to a point
    length_factor = min(1.0, length / 64.0)
    
    # Synthesis
    raw_score = gc_balance_score * skew_modifier * length_factor
    
    return round(max(0.1, min(1.0, raw_score)), 4)

def execute_regulation_step(logic_fn: Callable[[], bool]) -> Tuple[bool, float]:
    """
    Executes a regulation logic function and measures duration in milliseconds.
    Siphons telemetry patterns from the Tessera diagnostic engine.
    
    :param logic_fn: The boolean logic function to execute.
    :return: A tuple of (success_status, duration_ms).
    """
    telemetry = capture_execution_telemetry(logic_fn)
    
    # Extract core metrics for backward compatibility with DnaRegulator
    success = bool(telemetry.get("result", False)) if telemetry["success"] else False
    duration = telemetry.get("duration_ms", 0.0)
    
    return success, duration

def get_sequence_metadata(sequence: str) -> Dict[str, Any]:
    """
    Generates a comprehensive metadata report for a DNA sequence.
    
    :param sequence: The DNA sequence to analyze.
    :return: Dictionary containing entropy, skew, and length metrics.
    """
    seq = normalize_sequence(sequence)
    return {
        "length": len(seq),
        "entropy": calculate_shannon_entropy(seq),
        "gc_skew": calculate_gc_skew(seq),
        "gc_content": round((seq.count('G') + seq.count('C')) / len(seq), 4) if seq else 0.0
    }