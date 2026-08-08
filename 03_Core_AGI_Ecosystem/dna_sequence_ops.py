"""
DNA SEQUENCE OPERATIONS
Role: Provides low-level nucleotide transformations and sequence manipulation.
Integration: Utility layer for DNA sequence processing.
"""

from __future__ import annotations

COMPLEMENT_MAP = str.maketrans("ACGT", "TGCA")

def get_complement(sequence: str) -> str:
    """Returns the complement of a DNA sequence."""
    return sequence.upper().translate(COMPLEMENT_MAP)

def get_reverse_complement(sequence: str) -> str:
    """Returns the reverse complement of a DNA sequence."""
    return get_complement(sequence)[::-1]

def normalize_sequence(sequence: str) -> str:
    """Cleans and normalizes a DNA sequence string."""
    return "".join(sequence.upper().split())
