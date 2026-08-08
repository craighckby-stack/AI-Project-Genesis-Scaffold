"""
AI EVOLUTION SIMULATOR
Role: Manages the lifecycle of generative AI evolution simulations, tracking fitness metrics
      and state transitions across generations.
Integration: Connects to the system diagnostic registry for health monitoring and 
             delegates computational logic to evo_sim_utils.py.
"""

from __future__ import annotations
import logging
from typing import Dict, Any, List, Optional
from .evo_sim_utils import calculate_fitness, generate_simulation_id, validate_evolution_state

# Configure logging for the evolution engine
logger = logging.getLogger("AiEvoSim")

class AiEvoSim:
    """
    Core engine for simulating AI evolution.
    Maintains the state of the current simulation and provides hooks for 
    generation-based evolution cycles.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.sim_id = generate_simulation_id()
        self.config = config or {}
        self.generation = 0
        self.history: List[Dict[str, Any]] = []
        self.is_running = False
        logger.info(f"Evolution Simulator initialized: {self.sim_id}")

    def step(self, current_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a single evolution step.
        """
        if not validate_evolution_state(current_state):
            raise ValueError("Invalid evolution state provided.")

        self.generation += 1
        fitness = calculate_fitness(current_state)
        
        result = {
            "generation": self.generation,
            "fitness": fitness,
            "state": current_state,
            "timestamp": logging.Formatter.converter(None)
        }
        
        self.history.append(result)
        return result

    def get_latest_metrics(self) -> Optional[Dict[str, Any]]:
        """Returns the most recent simulation metrics."""
        return self.history[-1] if self.history else None

    def reset(self):
        """Resets the simulation state."""
        self.generation = 0
        self.history = []
        self.sim_id = generate_simulation_id()
        logger.info(f"Simulation reset: {self.sim_id}")

# Global registry instance for simulation tracking
evolution_registry: Dict[str, AiEvoSim] = {}

def get_or_create_sim(sim_id: str) -> AiEvoSim:
    """Retrieves or creates a simulation instance in the registry."""
    if sim_id not in evolution_registry:
        evolution_registry[sim_id] = AiEvoSim()
    return evolution_registry[sim_id]