"""
ECHO V7: ADAPTIVE AGENT RESONANCE ENGINE
Role: Core adaptive agent system for signal propagation and state resonance.
Integration: Connects to the AGI kernel and DNA regulator for system-wide synchronization.
Dependencies: echo_v7_utils.py, echo_state_manager.py, echo_telemetry_provider.py, echo_resonance_engine.py
"""

from __future__ import annotations
import logging
import asyncio
from typing import Dict, Any, Callable, Optional, Union, Awaitable

# Internal dependencies delegated to specialized providers
from .echo_v7_utils import validate_echo_payload, format_echo_response, ResonanceMetrics
from .echo_state_manager import EchoStateManager
from .echo_telemetry_provider import EchoTelemetryProvider
from .echo_resonance_engine import EchoResonanceEngine

# Configure logging for the echo system
logger = logging.getLogger("EchoV7")

class EchoEngine:
    """
    The EchoEngine manages the propagation of signals across the AGI ecosystem.
    It utilizes a registry-based approach to handle incoming data and compute resonance.
    Siphons 'Zero-Leak' state isolation and 'Consensus Weighting' patterns for high integrity.
    """

    def __init__(self):
        # Registry for signal handlers
        self._registry: Dict[str, Callable[[Any], Union[Any, Awaitable[Any]]]] = {}
        
        # Specialized logic providers
        self._state_manager = EchoStateManager()
        self._telemetry = EchoTelemetryProvider()
        self._resonance_engine = EchoResonanceEngine()
        
        logger.info("EchoEngine V7 initialized with isolated state and telemetry providers.")

    def register_handler(self, signal_type: str, handler: Callable[[Any], Union[Any, Awaitable[Any]]]) -> None:
        """
        Registers a new handler for a specific signal type.
        Supports both synchronous and asynchronous handlers.
        """
        if not callable(handler):
            raise TypeError(f"Handler for {signal_type} must be callable.")
            
        self._registry[signal_type] = handler
        logger.info(f"Registered handler for signal: {signal_type}")

    async def propagate(self, signal_type: str, payload: Any) -> Dict[str, Any]:
        """
        Propagates a signal through the registered handlers.
        Ensures payload integrity, computes resonance metrics, and tracks telemetry.
        """
        # 1. Validation Phase
        if not validate_echo_payload(payload):
            logger.warning(f"Invalid payload rejected for signal: {signal_type}")
            return format_echo_response("INVALID_PAYLOAD", {"signal": signal_type})

        # 2. Handler Retrieval
        handler = self._registry.get(signal_type)
        if not handler:
            logger.debug(f"No handler registered for signal: {signal_type}")
            return format_echo_response("NO_HANDLER_FOUND", {"signal": signal_type})

        # 3. Execution & Telemetry Phase
        start_time = self._telemetry.start_trace(signal_type)
        status = "PROCESSED"
        
        try:
            # Execute handler (handle both sync and async)
            if asyncio.iscoroutinefunction(handler):
                result = await handler(payload)
            else:
                result = handler(payload)

            # 4. Resonance Calculation
            resonance_depth = self._resonance_engine.compute_resonance_depth(payload)
            signal_strength = ResonanceMetrics.compute_signal_strength(str(payload))
            
            metadata = {
                "signal_type": signal_type,
                "strength": signal_strength,
                "resonance_depth": resonance_depth,
                "status": status,
                "avg_latency_ms": self._telemetry.get_average_latency()
            }

            # 5. State Synchronization
            self._state_manager.update_signal_state(signal_type)
            self._state_manager.record_resonance(resonance_depth)
            
            return format_echo_response(result, metadata)

        except Exception as e:
            status = "ERROR"
            logger.error(f"Error during signal propagation for {signal_type}: {str(e)}", exc_info=True)
            return format_echo_response("PROPAGATION_FAILURE", {"error": str(e)})
        
        finally:
            # Record telemetry regardless of outcome
            self._telemetry.end_trace(start_time, signal_type, status)

    def get_engine_status(self) -> Dict[str, Any]:
        """
        Returns the current operational status and metrics of the EchoEngine.
        """
        state = self._state_manager.get_state()
        state["avg_latency_ms"] = self._telemetry.get_average_latency()
        return state

    def shutdown(self) -> None:
        """
        Performs a clean shutdown of the EchoEngine.
        """
        self._state_manager.set_active(False)
        logger.info("EchoEngine shutdown sequence completed.")

# Global instance for system-wide access (Singleton Pattern)
echo_engine = EchoEngine()

def get_echo_engine() -> EchoEngine:
    """Returns the singleton instance of the EchoEngine."""
    return echo_engine