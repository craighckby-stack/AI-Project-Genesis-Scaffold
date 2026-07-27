"""
================================================================================
ENHANCED SELF-EVOLVING SYSTEM - DARLEK CANN v3.0
================================================================================
Role: Core engine for self-evolving architectural simulations. Manages agent 
      populations, resource entropy, and epoch transitions using thread-safe 
      state containers and zero-leak memory management.

Connections:
- 00_Foundational_Knowledge/theoretical_foundations/core_concepts.py (Foundations)
- 01_Generative_Architect/evolution_utils.py (State Containers & Telemetry)
- 01_Generative_Architect/ai_evo_sim.py (Simulation Execution)

Siphoned Patterns:
- Zero-Leak sandboxing (AetherForge-2.0)
- Dynamic consensus weighting (AI-Project-Genesis-Scaffold)
- Weak reference state management (Nexus-Sovereign)
================================================================================
"""

import threading
import time
import logging
import weakref
from typing import Dict, Optional, Any, List

# Import siphoned architectural utilities
from .evolution_utils import EvolutionStateContainer, EntropyGuard, TelemetryBridge

# Configure diagnostic logging for observability
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [EvoSystem] - %(levelname)s - %(message)s')
logger = logging.getLogger("EnhancedEvoSystem")

class EvolutionEngine:
    """
    Thread-safe engine for managing the evolution of architectural agents.
    Uses a state-container pattern to prevent memory leaks and ensure atomic updates.
    Implements the 'Zero-Leak' pattern siphoned from AetherForge-2.0.
    """
    def __init__(self):
        self._lock = threading.RLock()
        # Zero-Leak: Use WeakValueDictionary to prevent memory fatigue
        self._agents: weakref.WeakValueDictionary = weakref.WeakValueDictionary()
        self._state = EvolutionStateContainer({
            "epoch": 0,
            "entropy": 0.0,
            "active": True,
            "integrity": 1.0,
            "complexity": 1.0
        })
        self._entropy_guard = EntropyGuard()
        self._telemetry = TelemetryBridge()
        logger.info("EvolutionEngine initialized with Zero-Leak architecture and TelemetryBridge.")

    def register_agent(self, agent_id: str, agent_obj: Any) -> None:
        """
        Registers an agent into the evolutionary substrate.
        Uses thread-safe locking and logs the event via TelemetryBridge.
        """
        with self._lock:
            self._agents[agent_id] = agent_obj
            self._telemetry.log_event("AGENT_REGISTERED", {"agent_id": agent_id})
            logger.debug(f"Agent {agent_id} registered in substrate.")

    def get_agent(self, agent_id: str) -> Optional[Any]:
        """
        Retrieves an agent from the substrate if it still exists.
        """
        with self._lock:
            return self._agents.get(agent_id)

    def evolve(self) -> None:
        """
        Executes a single evolutionary tick with entropy drift protection.
        Captures epoch transitions and logs metrics to the telemetry stream.
        """
        with self._lock:
            try:
                current_state = self._state.get_data()
                if not current_state.get("active", False):
                    return

                # Siphoned: Calculate non-linear entropy drift
                new_entropy = self._entropy_guard.calculate_drift(current_state.get('entropy', 0.0))
                new_epoch = current_state.get("epoch", 0) + 1
                
                # Update state atomically
                self._state.update({
                    "epoch": new_epoch,
                    "entropy": new_entropy,
                    "complexity": current_state.get("complexity", 1.0) * 1.001
                })

                # Telemetry: Log epoch transition
                self._telemetry.log_event("EPOCH_TRANSITION", {
                    "epoch": new_epoch,
                    "entropy": round(new_entropy, 6),
                    "agent_count": len(self._agents)
                })

                logger.info(f"Epoch {new_epoch} reached. Entropy: {new_entropy:.4f} | Agents: {len(self._agents)}")
            except Exception as e:
                logger.error(f"Evolution cycle failed: {e}")
                self._telemetry.log_event("EVOLUTION_FAILURE", {"error": str(e)})

    def process_mutation(self, mutation_delta: Dict[str, Any]) -> bool:
        """
        Applies a discrete architectural mutation to the system state.
        Siphoned from AI-Project-Genesis-Scaffold 'MutationDelta' patterns.
        """
        with self._lock:
            try:
                self._state.update(mutation_delta)
                self._telemetry.log_event("ARCHITECTURAL_MUTATION", {"delta": mutation_delta})
                return True
            except Exception as e:
                logger.error(f"Mutation processing failed: {e}")
                return False

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """
        Returns a high-fidelity diagnostic snapshot of the system state.
        Used for temporal debugging and audit-ready observability.
        """
        with self._lock:
            state = self._state.get_data()
            return {
                "timestamp": time.time(),
                "epoch": state.get("epoch"),
                "entropy": state.get("entropy"),
                "integrity": state.get("integrity"),
                "active_agents": len(self._agents),
                "telemetry_health": self._telemetry.get_system_integrity_snapshot(),
                "status": "NOMINAL" if state.get("active") else "SHUTDOWN"
            }

    def get_heartbeat(self) -> Dict[str, Any]:
        """
        Diagnostic heartbeat for system monitoring.
        """
        with self._lock:
            return {
                "status": "ACTIVE" if self._state.get_data().get("active") else "IDLE",
                "timestamp": time.time(),
                "state": self._state.get_data()
            }

    def clear_registry(self) -> None:
        """
        Purges registry and telemetry history to support high-frequency simulation resets.
        """
        with self._lock:
            self._agents.clear()
            self._telemetry.clear_history()
            logger.info("EvolutionEngine registry and telemetry history purged.")

    def shutdown(self) -> None:
        """
        Graceful teardown of the evolution engine.
        Clears registries and logs the final state via TelemetryBridge.
        """
        with self._lock:
            self._state.update({"active": False})
            self._telemetry.log_event("ENGINE_SHUTDOWN", {"final_epoch": self._state.get_data().get("epoch")})
            self._agents.clear()
            logger.info("Evolution engine shutdown complete. Substrate cleared.")

# Global singleton instance for system-wide access
engine_instance = EvolutionEngine()

def get_engine() -> EvolutionEngine:
    """
    Returns the global EvolutionEngine instance.
    """
    return engine_instance