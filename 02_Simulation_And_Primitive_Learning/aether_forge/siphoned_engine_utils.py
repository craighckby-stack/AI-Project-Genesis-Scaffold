import weakref
from typing import Dict, Any

class SimulationState:
    def __init__(self):
        self.clock = 0
        self.entropy = 0.0
        self.population = 0

    def to_dict(self) -> Dict[str, Any]:
        return {"clock": self.clock, "entropy": self.entropy, "population": self.population}

class AgentRegistry:
    def __init__(self):
        self._agents = weakref.WeakValueDictionary()

    def update_agents(self, state: SimulationState):
        # Logic for agent lifecycle management
        pass

class EntropyController:
    def process_decay(self, state: SimulationState):
        state.entropy += 0.001
