"""
DNA COMPLEXITY ENGINE
Role: Performs advanced mathematical analysis on DNA sequences, including entropy and skew calculations.
Integration: Used by dna_regulator_utils to validate and score sequences.
"""

from __future__ import annotations
import math
from typing import Dict

def calculate_shannon_entropy(sequence: str) -> float:
    """
    Calculates the Shannon entropy of a DNA sequence.
    Higher entropy indicates higher information density and complexity.
    """
    if not sequence:
        return 0.0
    
    seq = sequence.upper()
    length = len(seq)
    counts = {char: seq.count(char) for char in set(seq)}
    
    entropy = 0.0
    for count in counts.values():
        probability = count / length
        entropy -= probability * math.log2(probability)
        
    return round(entropy, 4)

def calculate_gc_skew(sequence: str) -> float:
    """
    Calculates GC skew: (G - C) / (G + C).
    Used to identify leading vs lagging strands and potential regulatory regions.
    """
    seq = sequence.upper()
    g_count = seq.count('G')
    c_count = seq.count('C')
    
    if (g_count + c_count) == 0:
        return 0.0
        
    return round((g_count - c_count) / (g_count + c_count), 4)

def analyze_kmer_distribution(sequence: str, k: int = 2) -> Dict[str, float]:
    """
    Analyzes the distribution of k-mers (subsequences of length k).
    """
    if len(sequence) < k:
        return {}
        
    seq = sequence.upper()
    kmers: Dict[str, int] = {}
    total = len(seq) - k + 1
    
    for i in range(total):
        kmer = seq[i:i+k]
        kmers[kmer] = kmers.get(kmer, 0) + 1
        
    return {kmer: round(count / total, 4) for kmer, count in kmers.items()}
