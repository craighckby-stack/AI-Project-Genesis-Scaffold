"""
First Learning Agi
==================

PURPOSE:
    First learning AGI — experiential/primitive learning engine.
    Manages agent experiential memory, state-action-reward loops, and primitive heuristic evolution.

STATUS:
    EVOLVED — Integrated with AetherForge-2.0 architectural patterns.
"""

import time
import uuid
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field

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
    Siphoned from AetherForge-2.0/AI-Project-Genesis-Scaffold.
    """
    def __init__(self, agent_id: int):
        self.agent_id = agent_id
        self.memory: List[Experience] = []
        self.heuristics: Dict[str, float] = {"curiosity": 0.5, "caution": 0.5}
        self.is_active = True

    def record_experience(self, state: str, action: str, reward: float, next_state: str):
        """Records a new experiential data point for the agent."""
        exp = Experience(state, action, reward, next_state)
        self.memory.append(exp)
        if len(self.memory) > 1000:
            self.memory.pop(0)

    def get_best_action(self, current_state: str) -> str:
        """Primitive decision making based on past experiences."""
        # Logic siphoned from AetherForge-2.0 heuristic models
        relevant = [e for e in self.memory if e.state == current_state]
        if not relevant:
            return "explore"
        
        best = max(relevant, key=lambda x: x.reward)
        return best.action

    def shutdown(self):
        """Zero-leak cleanup of agent learning state."""
        self.is_active = False
        self.memory.clear()

# Global interface for the Grog module
__all__ = ["GrogLearningEngine", "Experience"]