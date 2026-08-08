"""
ECHO V7 UTILITIES
Role: Helper functions for payload validation, response formatting, and resonance metrics.
Integration: Imported by echo_v7.py to standardize signal processing.
"""

from __future__ import annotations
import time
from typing import Any, Dict, Optional, TypedDict

class EchoResponse(TypedDict):
    status: str
    data: Any
    metadata: Dict[str, Any]
    timestamp: str

def validate_echo_payload(payload: Any) -> bool:
    """
    Validates that the payload is a non-empty dictionary.
    Siphons basic integrity check patterns from AI_Agent_OS.
    """
    if not isinstance(payload, dict):
        return False
    return len(payload) > 0

def format_echo_response(result: Any, metadata: Optional[Dict[str, Any]] = None) -> EchoResponse:
    """
    Formats the output of a signal propagation into a standardized structure.
    """
    return {
        "status": "SUCCESS" if result != "PROPAGATION_FAILURE" else "ERROR",
        "data": result,
        "metadata": metadata or {},
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

class ResonanceMetrics:
    """
    Static utility for computing signal strength.
    Delegates complex logic to EchoResonanceEngine for architectural depth.
    """
    @staticmethod
    def compute_signal_strength(payload_str: str) -> float:
        """
        Computes a heuristic signal strength based on payload length and character diversity.
        """
        if not payload_str:
            return 0.0
        length_factor = min(len(payload_str) / 1000.0, 1.0)
        diversity_factor = len(set(payload_str)) / 256.0
        return round((length_factor * 0.4) + (diversity_factor * 0.6), 4)
