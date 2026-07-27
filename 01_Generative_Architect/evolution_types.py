from dataclasses import dataclass

@dataclass
class EvolutionState:
    epoch: int
    entropy: float
    population_count: int
    is_stable: bool
