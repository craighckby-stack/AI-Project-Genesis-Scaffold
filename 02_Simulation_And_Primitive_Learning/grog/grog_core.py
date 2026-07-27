"""
@file 02_Simulation_And_Primitive_Learning/grog/grog_core.py
@description Core logic for Grog agent learning and environmental interaction.
"""

from dataclasses import dataclass
from typing import List, Optional

@dataclass
class LearningState:
    entropy: float
    knowledge_base: List[str]
    last_epoch: int

class GrogAgent:
    def __init__(self, name: str):
        self.name = name
        self.state = LearningState(0.0, [], 0)

class GrogEnvironment:
    def __init__(self):
        self.agents: List[GrogAgent] = []

    def add_agent(self, agent: GrogAgent):
        self.agents.append(agent)
