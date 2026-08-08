"""
ECHO V7 UTILITIES
Role: Helper functions for payload validation, response formatting, and resonance metrics.
Integration: Imported by echo_v7.py to standardize signal processing.
Architectural Note: Complex logic is delegated to specialized providers (ResonanceEngine, TelemetryProvider) 
to maintain a clean, surgical utility interface while siphoning high-integrity patterns from AI_Agent_OS.
"""

from __future__ import annotations
import time
from typing import Any, Dict, Optional, TypedDict

# Internal Delegation Imports
from .echo_resonance_engine import EchoResonanceEngine
from .echo_telemetry_provider import EchoTelemetryProvider
from .echo_payload_validator import EchoPayloadValidator

class EchoResponse(TypedDict):
    """Standardized response structure for Echo signal propagation."""
    status: str
    data: Any
    metadata: Dict[str, Any]
    timestamp: str

def validate_echo_payload(payload: Any) -> bool:
    """
    Validates that the payload is a non-empty dictionary and structurally sound.
    Delegates to EchoPayloadValidator for deep integrity checks.
    """
    return EchoPayloadValidator.is_structurally_sound(payload)

def format_echo_response(result: Any, metadata: Optional[Dict[str, Any]] = None) -> EchoResponse:
    """
    Formats the output of a signal propagation into a standardized structure.
    Siphons high-precision timestamping from EchoTelemetryProvider.
    """
    is_success = result != "PROPAGATION_FAILURE"
    
    return {
        "status": "SUCCESS" if is_success else "ERROR",
        "data": result,
        "metadata": metadata or {},
        "timestamp": EchoTelemetryProvider.get_timestamp()
    }

class ResonanceMetrics:
    """
    Static utility for computing signal strength and resonance depth.
    Delegates complex mathematical logic to EchoResonanceEngine for architectural depth.
    """
    @staticmethod
    def compute_signal_strength(payload_str: str) -> float:
        """
        Computes a heuristic signal strength based on Shannon entropy and character diversity.
        Siphons information density patterns from EchoResonanceEngine.
        """
        if not payload_str:
            return 0.0
            
        entropy = EchoResonanceEngine.compute_shannon_entropy(payload_str)
        # Normalize entropy (max for 256 chars is 8.0)
        entropy_factor = min(entropy / 8.0, 1.0)
        
        length_factor = min(len(payload_str) / 1000.0, 1.0)
        
        # Weighted heuristic: 70% Entropy (Information Density), 30% Length (Signal Volume)
        return round((entropy_factor * 0.7) + (length_factor * 0.3), 4)

    @staticmethod
    def get_resonance_metadata(payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a comprehensive resonance profile for a given payload.
        """
        payload_str = str(payload)
        return {
            "strength": ResonanceMetrics.compute_signal_strength(payload_str),
            "entropy": EchoResonanceEngine.compute_shannon_entropy(payload_str),
            "depth": EchoResonanceEngine.calculate_resonance_depth(payload),
            "size_bytes": len(payload_str.encode('utf-8'))
        }