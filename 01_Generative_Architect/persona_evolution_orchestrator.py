"""
Persona Evolution Orchestrator
==============================

PURPOSE:
    Orchestrates the lifecycle and evolution of persona configurations.
    Manages state transitions, schema validation, and evolution history tracking.

INTEGRATION:
    Connects to the system's diagnostic engine and evolution registry.
    Delegates complex state computation to persona_evolution_utils.py.

STATUS:
    ACTIVE — Synthesized from AI_Agent_OS diagnostic patterns.
"""

from __future__ import annotations
import logging
from typing import Dict, Any, List, Optional
from .persona_evolution_utils import (
    validate_persona_schema, 
    compute_evolution_delta, 
    execute_evolution_step
)

class PersonaEvolutionOrchestrator:
    """
    Orchestrates persona evolution cycles.
    Maintains a registry of active personas and their evolution history.
    """

    def __init__(self):
        self._persona_registry: Dict[str, Dict[str, Any]] = {}
        self.logger = logging.getLogger("PersonaEvolutionOrchestrator")

    def register_persona(self, persona_id: str, initial_state: Dict[str, Any]) -> bool:
        """Registers a new persona into the evolution pipeline."""
        if not validate_persona_schema(initial_state):
            self.logger.error(f"Failed to register persona {persona_id}: Invalid Schema")
            return False
        
        self._persona_registry[persona_id] = initial_state
        return True

    def evolve(self, persona_id: str, evolution_fn: callable) -> Optional[Dict[str, Any]]:
        """
        Performs an evolution step on a registered persona.
        
        :param persona_id: The ID of the persona to evolve.
        :param evolution_fn: A function that returns the new state.
        :return: The delta of the evolution or None if failed.
        """
        if persona_id not in self._persona_registry:
            return None

        old_state = self._persona_registry[persona_id].copy()
        success, new_state = execute_evolution_step(lambda: evolution_fn(old_state))

        if success:
            delta = compute_evolution_delta(old_state, new_state)
            self._persona_registry[persona_id] = new_state
            self.logger.info(f"Persona {persona_id} evolved successfully.")
            return delta
        
        self.logger.error(f"Evolution failed for persona {persona_id}")
        return None

    def get_persona_state(self, persona_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves the current state of a persona."""
        return self._persona_registry.get(persona_id)

# Singleton instance for system-wide access
orchestrator = PersonaEvolutionOrchestrator()