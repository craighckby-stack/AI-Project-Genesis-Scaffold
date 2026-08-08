"""
ECHO RESONANCE ENGINE
Role: Advanced signal analysis and entropy computation for Echo V7.
Integration: Delegated from echo_v7_utils.py to provide deep resonance metrics.
"""

from __future__ import annotations
import math
from typing import Dict, Any

class EchoResonanceEngine:
    @staticmethod
    def compute_shannon_entropy(data: str) -> float:
        """Computes the Shannon entropy of a signal payload to determine information density."""
        if not data:
            return 0.0
        
        frequencies = {}
        for char in data:
            frequencies[char] = frequencies.get(char, 0) + 1
        
        entropy = 0.0
        length = len(data)
        for count in frequencies.values():
            p_x = count / length
            entropy -= p_x * math.log2(p_x)
            
        return round(entropy, 4)

    @staticmethod
    def calculate_resonance_depth(payload: Dict[str, Any]) -> float:
        """Calculates the depth of resonance based on nested complexity and key distribution."""
        if not payload:
            return 0.0
        
        depth = 0
        stack = [(payload, 1)]
        while stack:
            curr, d = stack.pop()
            depth = max(depth, d)
            if isinstance(curr, dict):
                for v in curr.values():
                    if isinstance(v, (dict, list)):
                        stack.append((v, d + 1))
        
        return float(depth)
