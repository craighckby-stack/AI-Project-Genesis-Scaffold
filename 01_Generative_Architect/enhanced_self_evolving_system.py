"""
Enhanced Self Evolving System
=============================

PURPOSE:
    Core engine for self-evolving architectural simulations. Manages agent populations,
    resource entropy, and epoch transitions using thread-safe state containers.

INTEGRATION:
    Connects to 00_Foundational_Knowledge for conceptual grounding and 
    01_Generative_Architect/ai_evo_sim.py for simulation execution.

SIPHONED PATTERNS:
    - Zero-Leak sandboxing (AetherForge-2.0)
    - Dynamic consensus weighting (AI-Project-Genesis-Scaffold)
    - Weak reference state management (Nexus-Sovereign)
"""

import threading
import time
import logging
import weakref
from typing import Dict, Optional, Any
from .evolution_utils import EvolutionStateContainer, EntropyGuard

# Configure diagnostic logging for observability
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [EvoSystem] - %(levelname)s - %(message)s')
logger = logging.getLogger("EnhancedEvoSystem")

class EvolutionEngine:
    """
    Thread-safe engine for managing the evolution of architectural agents.
    Uses a state-container pattern to prevent memory leaks and ensure atomic updates.
    """
    def __init__(self):
        self._lock = threading.RLock()
        self._agents: weakref.WeakValueDictionary = weakref.WeakValueDictionary()
        self._state = EvolutionStateContainer({
            "epoch": 0,
            "entropy": 0.0,
            "active": True
        })
        self._entropy_guard = EntropyGuard()
        logger.info("EvolutionEngine initialized with Zero-Leak architecture.")

    def register_agent(self, agent_id: str, agent_obj: Any) -> None:
        with self._lock:
            self._agents[agent_id] = agent_obj

    def get_agent(self, agent_id: str) -> Optional[Any]:
        with self._lock:
            return self._agents.get(agent_id)

    def evolve(self) -> None:
        """Executes a single evolutionary tick with entropy drift protection."""
        with self._lock:
            current_state = self._state.get_data()
            new_entropy = self._entropy_guard.calculate_drift(current_state.get('entropy', 0.0))
            
            self._state.update({
                "epoch": current_state.get("epoch", 0) + 1,
                "entropy": new_entropy
            })
            logger.info(f"Epoch {self._state.get_data()['epoch']} reached. Entropy: {new_entropy:.4f}")

    def get_heartbeat(self) -> Dict[str, Any]:
        """Diagnostic heartbeat for system monitoring."""
        with self._lock:
            return {
                "status": "ACTIVE",
                "timestamp": time.time(),
                "state": self._state.get_data()
            }

    def shutdown(self) -> None:
        """Graceful teardown of the evolution engine."""
        with self._lock:
            self._state.update({"active": False})
            self._agents.clear()
            logger.info("Evolution engine shutdown complete.")

# Global singleton instance for system-wide access
engine_instance = EvolutionEngine()

def get_engine() -> EvolutionEngine:
    return engine_instance