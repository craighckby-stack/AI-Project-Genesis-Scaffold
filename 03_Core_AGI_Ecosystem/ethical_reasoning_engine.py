"""
================================================================================
ETHICAL REASONING ENGINE - CORE ALIGNMENT LAYER
================================================================================
Role: Provides a robust, deterministic framework for evaluating agent actions 
      against systemic ethical constraints and moral vectors. Acts as a core 
      component for the AGI Ecosystem's moral alignment layer.

Connections:
- 03_Core_AGI_Ecosystem/agi_kernel.py (Kernel Orchestrator)
- 03_Core_AGI_Ecosystem/echo_v7.py (Resonance Propagation)
- 02_Simulation_And_Primitive_Learning/aether_forge/siphoned_engine_utils.py (Telemetry)
================================================================================
"""

import logging
import threading
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# Import siphoned architectural utilities
from ..aether_forge.siphoned_engine_utils import TelemetryBridge

# Configure logging for the ethical engine
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EthicalReasoningEngine")

@dataclass
class EthicalVector:
    agent_id: int
    moral_alignment: float  # -1.0 (Malevolent) to 1.0 (Benevolent)
    deontological_score: float
    utilitarian_score: float
    last_decision_timestamp: float

class EthicalReasoningEngine:
    """
    Core engine for managing and evaluating ethical state within the AGI ecosystem.
    Uses atomic locking to ensure thread-safe moral state updates.
    """
    def __init__(self):
        self._registry: Dict[int, EthicalVector] = {}
        self._lock = threading.RLock()
        self._telemetry = TelemetryBridge()
        self.heartbeat = 0

    def register_agent(self, agent_id: int, initial_alignment: float = 0.0):
        """Registers an agent into the moral registry with thread safety."""
        with self._lock:
            self._registry[agent_id] = EthicalVector(
                agent_id=agent_id,
                moral_alignment=initial_alignment,
                deontological_score=0.5,
                utilitarian_score=0.5,
                last_decision_timestamp=time.time()
            )
            logger.info(f"Agent {agent_id} registered in Ethical Engine.")
            self._telemetry.log_event("AGENT_REGISTERED", {"agent_id": agent_id})

    def evaluate_action(self, agent_id: int, action_impact: float) -> bool:
        """
        Evaluates if a proposed action is permissible based on current moral alignment.
        Returns True if permissible, False otherwise.
        """
        with self._lock:
            if agent_id not in self._registry:
                return True  # Default to permissive if unknown
            
            vector = self._registry[agent_id]
            is_permissible = (vector.moral_alignment + action_impact) > -0.8
            
            if not is_permissible:
                logger.warning(f"Ethical violation blocked for agent {agent_id}.")
                self._telemetry.log_event("ETHICAL_VIOLATION", {"agent_id": agent_id, "impact": action_impact})
            
            return is_permissible

    def update_alignment(self, agent_id: int, delta: float):
        """Atomically updates an agent's moral alignment."""
        with self._lock:
            if agent_id in self._registry:
                self._registry[agent_id].moral_alignment += delta
                self._registry[agent_id].moral_alignment = max(-1.0, min(1.0, self._registry[agent_id].moral_alignment))
                self._telemetry.log_event("ALIGNMENT_UPDATED", {"agent_id": agent_id, "new_alignment": self._registry[agent_id].moral_alignment})

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """Facilitates temporal debugging by returning a snapshot of system integrity."""
        with self._lock:
            integrity = self.get_system_integrity()
            return {
                "timestamp": time.time(),
                "aggregate_integrity": integrity,
                "registry_size": len(self._registry)
            }

    def get_system_integrity(self) -> float:
        """Calculates the aggregate moral integrity of the system."""
        with self._lock:
            if not self._registry:
                return 1.0
            total = sum(v.moral_alignment for v in self._registry.values())
            return total / len(self._registry)

    def shutdown(self) -> None:
        """Zero-leak cleanup of the ethical registry."""
        with self._lock:
            self._registry.clear()
            logger.info("EthicalReasoningEngine registry cleared.")

# Global instance for ecosystem access
engine = EthicalReasoningEngine()