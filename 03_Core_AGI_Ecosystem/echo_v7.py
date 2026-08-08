"""
ECHO V7: ADAPTIVE AGENT RESONANCE ENGINE
Role: Core adaptive agent system for signal propagation and state resonance.
Integration: Connects to the AGI kernel and DNA regulator for system-wide synchronization.
Dependencies: echo_v7_utils.py
"""

from __future__ import annotations
import logging
from typing import Dict, Any, Callable, Optional
from .echo_v7_utils import validate_echo_payload, format_echo_response, ResonanceMetrics

# Configure logging for the echo system
logger = logging.getLogger("EchoV7")

class EchoEngine:
    """
    The EchoEngine manages the propagation of signals across the AGI ecosystem.
    It utilizes a registry-based approach to handle incoming data and compute resonance.
    """

    def __init__(self):
        self._registry: Dict[str, Callable[[Any], Any]] = {}
        self._state: Dict[str, Any] = {"active": True, "last_signal": None}

    def register_handler(self, signal_type: str, handler: Callable[[Any], Any]) -> None:
        """Registers a new handler for a specific signal type."""
        self._registry[signal_type] = handler
        logger.info(f"Registered handler for signal: {signal_type}")

    async def propagate(self, signal_type: str, payload: Any) -> Dict[str, Any]:
        """
        Propagates a signal through the registered handlers.
        Ensures payload integrity and computes resonance metrics.
        """
        if not validate_echo_payload(payload):
            raise ValueError("Invalid payload format provided to EchoEngine.")

        handler = self._registry.get(signal_type)
        if not handler:
            return format_echo_response("NO_HANDLER_FOUND", {"signal": signal_type})

        try:
            result = handler(payload)
            metadata = {
                "signal_type": signal_type,
                "strength": ResonanceMetrics.compute_signal_strength(str(payload)),
                "status": "PROCESSED"
            }
            self._state["last_signal"] = signal_type
            return format_echo_response(result, metadata)
        except Exception as e:
            logger.error(f"Error during signal propagation: {str(e)}")
            return format_echo_response("PROPAGATION_FAILURE", {"error": str(e)})

# Global instance for system-wide access
echo_engine = EchoEngine()

def get_echo_engine() -> EchoEngine:
    """Returns the singleton instance of the EchoEngine."""
    return echo_engine