"""
EULER MATH HELPERS
Role: Lower-level mathematical stability analysis, hash digests, and metric aggregation.
Integration: Created as a supporting utility module for euler_engine_utils.py.
"""

from __future__ import annotations
import math
import hashlib
import datetime
from typing import Dict, Any, List

def format_utc_timestamp() -> str:
    """Returns ISO 8601 formatted UTC timestamp with Z suffix."""
    return datetime.datetime.utcnow().isoformat() + 'Z'

def compute_formula_hash(formula: str) -> str:
    """Generates a SHA-256 digest substring for a mathematical formula string."""
    if not isinstance(formula, str):
        formula = str(formula)
    return hashlib.sha256(formula.encode('utf-8')).hexdigest()[:16]

def is_numerically_stable(val: float, min_threshold: float = -1e12, max_threshold: float = 1e12) -> bool:
    """Checks if a numeric value is non-NaN, non-Inf, and within stable bounds."""
    if not isinstance(val, (int, float)):
        return False
    if math.isnan(val) or math.isinf(val):
        return False
    return min_threshold <= val <= max_threshold

def calculate_variance(values: List[float]) -> float:
    """Calculates variance for a series of evolution delta measurements."""
    if not values:
        return 0.0
    valid_vals = [v for v in values if is_numerically_stable(v)]
    if not valid_vals:
        return 0.0
    mean = sum(valid_vals) / len(valid_vals)
    return sum((x - mean) ** 2 for x in valid_vals) / len(valid_vals)
