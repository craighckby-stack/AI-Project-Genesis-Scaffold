"""
Ethical Reasoning Engine
========================

PURPOSE:
    Provides a robust, deterministic framework for evaluating agent actions against 
    systemic ethical constraints and moral vectors. Acts as a core component 
    for the AGI Ecosystem's moral alignment layer.

STATUS:
    ACTIVE - Synthesized via DARLEK CANN v3.0

INTEGRATION:
    Connects with agi_kernel.py for lifecycle management and echo_v7.py 
    for resonance-based moral propagation.
"""

import logging
import threading
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

# Configure logging for the ethical engine
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
        self.heartbeat = 0

    def register_agent(self, agent_id: int, initial_alignment: float = 0.0):
        with self._lock:
            self._registry[agent_id] = EthicalVector(
                agent_id=agent_id,
                moral_alignment=initial_alignment,
                deontological_score=0.5,
                utilitarian_score=0.5,
                last_decision_timestamp=0.0
            )
            logger.info(f"Agent {agent_id} registered in Ethical Engine.")

    def evaluate_action(self, agent_id: int, action_impact: float) -> bool:
        """
        Evaluates if a proposed action is permissible based on current moral alignment.
        Returns True if permissible, False otherwise.
        """
        with self._lock:
            if agent_id not in self._registry:
                return True  # Default to permissive if unknown
            
            vector = self._registry[agent_id]
            # Simple threshold logic for moral safety
            is_permissible = (vector.moral_alignment + action_impact) > -0.8
            
            if not is_permissible:
                logger.warning(f"Ethical violation blocked for agent {agent_id}.")
            
            return is_permissible

    def update_alignment(self, agent_id: int, delta: float):
        with self._lock:
            if agent_id in self._registry:
                self._registry[agent_id].moral_alignment += delta
                # Clamp values
                self._registry[agent_id].moral_alignment = max(-1.0, min(1.0, self._registry[agent_id].moral_alignment))

    def get_system_integrity(self) -> float:
        """
        Calculates the aggregate moral integrity of the system.
        """
        with self._lock:
            if not self._registry:
                return 1.0
            total = sum(v.moral_alignment for v in self._registry.values())
            return total / len(self._registry)

# Global instance for ecosystem access
engine = EthicalReasoningEngine()