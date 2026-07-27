"""
================================================================================
FIRST LEARNING AGI - PRIMITIVE LEARNING ENGINE (DARLEK CANN v3.0)
================================================================================
Role: Core experiential learning engine for primitive agents. Manages agent 
      experiential memory, state-action-reward loops, and heuristic evolution.

Connections:
- 02_Simulation_And_Primitive_Learning/aether_forge/siphoned_engine_utils.py (Telemetry/State)
- 01_Generative_Architect/evolution_utils.py (State Containers)
================================================================================
"""

import time
import threading
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

# Import siphoned architectural utilities
from ..aether_forge.siphoned_engine_utils import TelemetryBridge
from ...Generative_Architect.evolution_utils import EvolutionStateContainer

# Configure diagnostic logging
logger = logging.getLogger("GrogLearningEngine")

@dataclass
class Experience:
    state: str
    action: str
    reward: float
    next_state: str
    timestamp: float = field(default_factory=time.time)

class GrogLearningEngine:
    """
    Core engine for primitive agent learning. 
    Implements thread-safe memory management and telemetry-aware state transitions.
    """
    def __init__(self, agent_id: int):
        self.agent_id = agent_id
        self._lock = threading.RLock()
        self._state = EvolutionStateContainer({"memory_size": 0, "active": True})
        self.memory: List[Experience] = []
        self.heuristics: Dict[str, float] = {"curiosity": 0.5, "caution": 0.5}
        self._telemetry = TelemetryBridge()
        logger.info(f"GrogLearningEngine initialized for agent {agent_id}.")

    def record_experience(self, state: str, action: str, reward: float, next_state: str):
        """Records a new experiential data point with atomic state updates."""
        with self._lock:
            exp = Experience(state, action, reward, next_state)
            self.memory.append(exp)
            if len(self.memory) > 1000:
                self.memory.pop(0)
            
            self._state.update({"memory_size": len(self.memory)})
            self._telemetry.log_event("EXPERIENCE_RECORDED", {"agent_id": self.agent_id, "reward": reward})

    def get_best_action(self, current_state: str) -> str:
        """Primitive decision making based on past experiences."""
        with self._lock:
            relevant = [e for e in self.memory if e.state == current_state]
            if not relevant:
                return "explore"
            
            best = max(relevant, key=lambda x: x.reward)
            return best.action

    def get_heuristics(self) -> Dict[str, float]:
        """Returns the current heuristic weights for the agent."""
        with self._lock:
            return self.heuristics.copy()

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """Facilitates temporal debugging by returning a snapshot of the engine state."""
        with self._lock:
            return {
                "agent_id": self.agent_id,
                "memory_size": len(self.memory),
                "telemetry_health": self._telemetry.get_system_integrity_snapshot(),
                "status": "OPERATIONAL"
            }

    def clear_registry(self) -> None:
        """Purges memory and telemetry history to support high-frequency simulation resets."""
        with self._lock:
            self.memory.clear()
            self._telemetry.clear_history()
            self._state.update({"memory_size": 0})
            logger.info(f"GrogLearningEngine registry and history purged for agent {self.agent_id}.")

    def shutdown(self):
        """Zero-leak cleanup of agent learning state."""
        with self._lock:
            self._state.update({"active": False})
            self.memory.clear()
            logger.info(f"GrogLearningEngine shutdown for agent {self.agent_id}.")

# Global interface for the Grog module
__all__ = ["GrogLearningEngine", "Experience"]