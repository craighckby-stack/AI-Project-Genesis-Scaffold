"""
================================================================================
EVOLUTION TYPES - CORE SCHEMA DEFINITIONS (DARLEK CANN v3.0)
================================================================================
Role: Defines the shared conceptual vocabulary and data structures for the 
      Generative Architect evolution engine. Provides strictly typed schemas 
      for simulation states, agent profiles, evolutionary metrics, and 
      diagnostic telemetry snapshots.

Connections:
- 01_Generative_Architect/evolution_engine.py (Evolutionary Logic)
- 01_Generative_Architect/ai_evo_sim.py (Simulation Core)
- 01_Generative_Architect/evolution_utils.py (Telemetry Bridge)
================================================================================
"""

from enum import Enum
from typing import TypedDict, List, Dict, Any, Optional, Final

# --- EVOLUTIONARY CLASSIFICATIONS ---

class EvolutionPhase(Enum):
    STASIS = "STASIS"
    MUTATION = "MUTATION"
    CONVERGENCE = "CONVERGENCE"
    DIVERGENCE = "DIVERGENCE"
    SINGULARITY = "SINGULARITY"

class AgentArchetype(Enum):
    ARCHITECT = "ARCHITECT"
    OBSERVER = "OBSERVER"
    CATALYST = "CATALYST"
    ENTROPY_AGENT = "ENTROPY_AGENT"

# --- CORE DATA STRUCTURES ---

class EvolutionState(TypedDict):
    """Represents the global state of the evolutionary simulation."""
    epoch: int
    entropy: float
    population_count: int
    is_stable: bool
    phase: EvolutionPhase
    metadata: Dict[str, Any]

class AgentProfile(TypedDict):
    """Represents the genetic and cognitive profile of an agent."""
    id: str
    archetype: AgentArchetype
    fitness_score: float
    mutation_rate: float
    memory_depth: int
    traits: List[str]

class MutationDelta(TypedDict):
    """Represents a discrete change applied to an architectural component."""
    target_id: str
    parameter: str
    value: Any
    confidence: float
    timestamp: float

class TelemetrySchema(TypedDict):
    """Standardized schema for diagnostic telemetry events."""
    timestamp: float
    uptime: float
    sequence_num: int
    event_type: str
    data: Dict[str, Any]

class SystemDiagnosticSnapshot(TypedDict):
    """Schema for system-wide integrity and diagnostic snapshots."""
    timestamp: float
    status: str
    health: Dict[str, Any]
    recent_events_sample: List[TelemetrySchema]

class SystemIntegritySchema(TypedDict):
    """Schema for system-wide integrity snapshots."""
    timestamp: float
    status: str
    entropy_level: float
    module_health: Dict[str, str]

# --- SYSTEM CONSTANTS ---

DEFAULT_STABILITY_THRESHOLD: Final[float] = 0.85
MAX_EVOLUTION_CYCLES: Final[int] = 10000

__all__ = [
    "EvolutionPhase",
    "AgentArchetype",
    "EvolutionState",
    "AgentProfile",
    "MutationDelta",
    "TelemetrySchema",
    "SystemDiagnosticSnapshot",
    "SystemIntegritySchema",
    "DEFAULT_STABILITY_THRESHOLD",
    "MAX_EVOLUTION_CYCLES"
]