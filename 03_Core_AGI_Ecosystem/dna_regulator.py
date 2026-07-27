"""
DNA Regulator
=============

PURPOSE:
    DNA-based regulator core — computational thinking control and phenotypic expression management.
    This module acts as the primary genetic controller for the AGI ecosystem, managing mutation rates,
    phenotypic stability, and evolutionary drift.

INTEGRATION:
    Connects to `agi_kernel.py` for lifecycle monitoring and `grog/first_learning_agi.py` 
    for experiential memory-based genetic feedback.

STATUS:
    EVOLVED — DARLEK CANN v3.0 Compliant
"""

import uuid
import logging
import threading
import time
from typing import Dict, Any, List, Optional

# Import siphoned architectural utilities
from ..aether_forge.siphoned_engine_utils import TelemetryBridge

# Configure logging for DNA diagnostic tracking
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("DNARegulator")

class DNARegulator:
    """
    Regulates the genetic expression and mutation lifecycle of agents.
    Ensures that evolutionary mutations remain within safe operational bounds.
    Implements thread-safe atomic state transitions and telemetry-aware auditing.
    """
    def __init__(self, mutation_rate: float = 0.01, stability_threshold: float = 0.85):
        self.mutation_rate = mutation_rate
        self.stability_threshold = stability_threshold
        self._mutation_registry: Dict[str, List[Dict[str, Any]]] = {}
        self._lock = threading.RLock()
        self._telemetry = TelemetryBridge()
        logger.info("DNARegulator initialized with stability threshold: %s", stability_threshold)

    def apply_mutation(self, agent_id: str, genetic_payload: Dict[str, Any]) -> bool:
        """
        Atomically applies a mutation to an agent's genetic profile.
        Checks against stability threshold before committing and logs via TelemetryBridge.
        """
        with self._lock:
            if agent_id not in self._mutation_registry:
                self._mutation_registry[agent_id] = []

            # Validate stability
            if genetic_payload.get("volatility", 0) > self.stability_threshold:
                logger.warning("Mutation rejected for agent %s: Stability threshold exceeded.", agent_id)
                self._telemetry.log_event("MUTATION_REJECTED", {"agent_id": agent_id, "reason": "stability_threshold"})
                return False

            mutation_record = {
                "id": str(uuid.uuid4()),
                "payload": genetic_payload,
                "timestamp": time.time()
            }
            self._mutation_registry[agent_id].append(mutation_record)
            
            # Log successful mutation
            self._telemetry.log_event("MUTATION_APPLIED", {"agent_id": agent_id, "mutation_id": mutation_record["id"]})
            return True

    def get_genetic_history(self, agent_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves the mutation history for a specific agent.
        Provides a snapshot for temporal debugging.
        """
        with self._lock:
            return self._mutation_registry.get(agent_id, []).copy()

    def reset_agent_genetics(self, agent_id: str) -> None:
        """
        Clears genetic history for an agent, reverting to base state.
        """
        with self._lock:
            if agent_id in self._mutation_registry:
                del self._mutation_registry[agent_id]
                self._telemetry.log_event("GENETIC_RESET", {"agent_id": agent_id})
                logger.info("Genetic history cleared for agent %s", agent_id)

# Singleton instance for system-wide access
dna_regulator = DNARegulator()