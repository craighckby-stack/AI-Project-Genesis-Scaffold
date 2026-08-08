"""
ECHO RESONANCE ENGINE
Role: Sophisticated signal analysis and resonance depth calculation.
Integration: Siphons 'Consensus Weighting' logic to determine signal impact.
"""

from __future__ import annotations
import math
from typing import Any, Dict

class EchoResonanceEngine:
    def compute_resonance_depth(self, payload: Dict[str, Any]) -> float:
        """
        Calculates the resonance depth based on payload complexity and entropy.
        """
        payload_str = str(payload)
        if not payload_str:
            return 0.0

        # Shannon Entropy calculation for signal complexity
        prob = [float(payload_str.count(c)) / len(payload_str) for c in dict.fromkeys(list(payload_str))]
        entropy = - sum([p * math.log(p) / math.log(2.0) for p in prob])
        
        # Normalize entropy (max for 256 chars is 8)
        normalized_entropy = min(entropy / 8.0, 1.0)
        
        # Key count factor
        key_factor = min(len(payload.keys()) / 10.0, 1.0)

        return round((normalized_entropy * 0.7) + (key_factor * 0.3), 4)
