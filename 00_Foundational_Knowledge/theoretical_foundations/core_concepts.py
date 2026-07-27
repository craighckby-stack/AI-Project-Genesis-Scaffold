"""
================================================================================
THEORETICAL FOUNDATIONS - CORE CONCEPTS (DARLEK CANN v3.0)
================================================================================
Role: Defines the shared conceptual vocabulary, data structures, and architectural
      principles for the AGI ecosystem. Provides the foundational types and 
      constants used by simulation engines and governance modules.

Connections:
- 00_Foundational_Knowledge/encyclopedia_of_engineering/consensus.py (Consensus Engine)
- 01_Generative_Architect/ai_evo_sim.py (Evolution Simulator)
- 03_Core_AGI_Ecosystem/agi_kernel.py (AGI Kernel)
================================================================================
"""

import threading
import logging
import time
from enum import Enum
from collections import deque
from typing import TypedDict, List, Dict, Any, Optional

# Import siphoned telemetry bridge for high-fidelity observability
from .telemetry_bridge import TheoreticalTelemetryBridge

# Configure diagnostic logging
logger = logging.getLogger("CoreConcepts")

# --- COSMIC & EPOCH CLASSIFICATIONS ---

class CosmicPhase(Enum):
    GENESIS = "GENESIS"
    STELLAR_VOID = "STELLAR_VOID"
    RECONSTRUCTION = "RECONSTRUCTION"
    JUDGMENT = "JUDGMENT"
    REQUIEM_EXPLOSION = "REQUIEM_EXPLOSION"
    STELLAR_REQUIEM = "STELLAR_REQUIEM"

class EpochType(Enum):
    PRIMAL = "PRIMAL"
    AWAKENING = "AWAKENING"
    ENLIGHTENMENT = "ENLIGHTENMENT"
    TRANSCENDENCE = "TRANSCENDENCE"
    SINGULARITY = "SINGULARITY"
    AGRARIAN = "AGRARIAN"
    CLASSICAL = "CLASSICAL"
    INDUSTRIAL = "INDUSTRIAL"
    INFORMATION = "INFORMATION"
    POST_HUMAN = "POST_HUMAN"

class Ideology(Enum):
    THEOCRACY = "THEOCRACY"
    TECHNOCRACY = "TECHNOCRACY"
    DEMOCRACY = "DEMOCRACY"
    AUTOCRACY = "AUTOCRACY"
    ANARCHY = "ANARCHY"

class Archetype(Enum):
    PRIEST = "PRIEST"
    SCHOLAR = "SCHOLAR"
    WARRIOR = "WARRIOR"
    ARTISAN = "ARTISAN"
    PROPHET = "PROPHET"
    ZEALOT = "ZEALOT"
    SCIENTIST = "SCIENTIST"
    HERETIC = "HERETIC"
    ANGEL = "ANGEL"
    DEMON = "DEMON"
    MESSIAH = "MESSIAH"
    TYRANT = "TYRANT"
    GLITCH = "GLITCH"

# --- CONCEPTUAL DATA STRUCTURES ---

class ResourceNode(TypedDict):
    id: str
    x: float
    y: float
    energy: float
    amount: float
    type: str

class PrayerEmail(TypedDict):
    id: str
    agentId: int
    agentName: str
    archetype: Archetype
    subject: str
    body: str
    status: str
    receivedAt: float

class EventRecord(TypedDict):
    timestamp: float
    message: str
    type: str

class Nation(TypedDict):
    id: str
    name: str
    ideology: Ideology
    population: int
    prosperity: float

class Agent(TypedDict):
    id: int
    name: str
    archetype: Archetype
    awareness: float
    sanity: float
    rationalism: float
    energy: float
    health: float

class WorldState(TypedDict):
    clock: float
    complexity: float
    integrity: float
    population: int
    epoch: EpochType
    phase: CosmicPhase

# --- FOUNDATIONAL CONSTANTS ---

EPOCH_DATA = {
    EpochType.PRIMAL: {"label": "Primal Foundation", "threshold": 0},
    EpochType.AGRARIAN: {"label": "Agrarian", "threshold": 50},
    EpochType.AWAKENING: {"label": "Age of Awakening", "threshold": 100},
    EpochType.CLASSICAL: {"label": "Classical", "threshold": 150},
    EpochType.ENLIGHTENMENT: {"label": "Age of Enlightenment", "threshold": 200},
    EpochType.INDUSTRIAL: {"label": "Industrial", "threshold": 250},
    EpochType.TRANSCENDENCE: {"label": "Era of Transcendence", "threshold": 300},
    EpochType.INFORMATION: {"label": "Information", "threshold": 350},
    EpochType.SINGULARITY: {"label": "Singularity", "threshold": 400},
    EpochType.POST_HUMAN: {"label": "Post-Human", "threshold": 450}
}

# --- ARCHITECTURAL REGISTRY ---

class CoreConceptRegistry:
    """Thread-safe registry for managing foundational constants and types with Zero-Leak telemetry."""
    def __init__(self, history_max_size: int = 100):
        self._lock = threading.RLock()
        self._telemetry = TheoreticalTelemetryBridge()
        self._registry: Dict[str, Any] = {"epoch_data": EPOCH_DATA}
        self._event_history: deque[Dict[str, Any]] = deque(maxlen=history_max_size)
        self._event_sequence_num = 0

    def get_concept(self, key: str) -> Any:
        with self._lock:
            self.log_access(key)
            return self._registry.get(key)

    def log_access(self, key: str):
        with self._lock:
            self._event_sequence_num += 1
            event = {"timestamp": time.time(), "sequence": self._event_sequence_num, "key": key}
            self._event_history.append(event)
            self._telemetry.log_event("CONCEPT_ACCESS", event)

    def clear_registry(self) -> None:
        """Purges history to prevent memory leaks during simulation resets."""
        with self._lock:
            self._event_history.clear()
            logger.info("CoreConceptRegistry history cleared.")

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """Facilitates temporal debugging by returning a snapshot of the registry state."""
        with self._lock:
            return {
                "timestamp": time.time(),
                "total_events": self._event_sequence_num,
                "recent_events": list(self._event_history)[-5:],
                "status": "OPERATIONAL"
            }

# Global instance for system-wide access
registry = CoreConceptRegistry()

PRINCIPLE_DYNAMIC_CONSENSUS = "Game-theoretic Nash Equilibrium resolution for multi-agent specifications."
PRINCIPLE_ZERO_LEAK_SANDBOX = "Thread-scoped, isolated execution environment with restricted built-in access."
PRINCIPLE_RECURSIVE_CONVERGENCE = "Self-improvement cycle for intelligence growth and systemic stability."