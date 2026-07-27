"""
Echo V7
=======

PURPOSE:
    Adaptive agent resonance and communication propagation engine.
    Manages systemic feedback loops and narrative state synchronization.

STATUS:
    PRODUCTION-READY (v7.0.1)

INTEGRATION:
    - Connects to agi_kernel.py for lifecycle management.
    - Connects to dna_regulator.py for phenotypic resonance updates.
"""

import threading
import logging
import time
from typing import Dict, List, Optional, Any

# Configure logging for resonance tracking
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EchoResonanceEngine")

class EchoResonanceEngine:
    """
    Manages the propagation of information and narrative resonance 
    across the agent ecosystem.
    """
    def __init__(self):
        self._resonance_registry: Dict[str, List[Any]] = {}
        self._lock = threading.RLock()
        self._active = True
        self._heartbeat_interval = 1.0

    def broadcast_resonance(self, source_id: str, payload: Dict[str, Any]) -> None:
        """Broadcasts a state change or narrative event to the resonance registry."""
        with self._lock:
            if source_id not in self._resonance_registry:
                self._resonance_registry[source_id] = []
            self._resonance_registry[source_id].append({
                "timestamp": time.time(),
                "data": payload,
                "integrity": 1.0
            })
            logger.debug(f"Resonance broadcast from {source_id}")

    def get_agent_resonance(self, agent_id: str) -> List[Any]:
        """Retrieves the resonance history for a specific agent."""
        with self._lock:
            return self._resonance_registry.get(agent_id, [])

    def clear_stale_resonance(self, threshold: float) -> None:
        """Prunes stale resonance data to prevent memory leaks."""
        with self._lock:
            now = time.time()
            for agent_id in list(self._resonance_registry.keys()):
                self._resonance_registry[agent_id] = [
                    r for r in self._resonance_registry[agent_id] 
                    if (now - r['timestamp']) < threshold
                ]

    def shutdown(self) -> None:
        """Graceful teardown of the resonance engine."""
        with self._lock:
            self._active = False
            self._resonance_registry.clear()
            logger.info("EchoResonanceEngine shutdown complete.")

# Global singleton instance for system-wide access
echo_engine = EchoResonanceEngine()