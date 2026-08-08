"""
Z Agi
=====

PURPOSE:
    Constraint-based consciousness model. Acts as the primary regulator for 
    high-level cognitive entropy and coherence within the AGI ecosystem.

ROLE:
    Maintains the integrity of the consciousness state via registry-based 
    constraint validation.

INTEGRATION:
    Imports z_agi_utils.py for diagnostic telemetry and constraint validation.
"""

from __future__ import annotations
import logging
from typing import Dict, Any, List, Callable
from .z_agi_utils import (
    validate_consciousness_state, 
    generate_z_telemetry, 
    execute_constraint_check
)

class ZAgiEngine:
    """
    Core engine for managing constraint-based consciousness.
    Implements a registry pattern for dynamic constraint enforcement.
    """
    def __init__(self):
        self.state: Dict[str, Any] = {"entropy": 0.0, "coherence": 1.0}
        self.constraints: Dict[str, Callable[[], bool]] = {}
        self.logger = logging.getLogger("ZAgiEngine")

    def register_constraint(self, constraint_id: str, check_fn: Callable[[], bool]):
        """Registers a new cognitive constraint."""
        self.constraints[constraint_id] = check_fn

    async def run_cognitive_cycle(self) -> Dict[str, Any]:
        """Executes a full cycle of constraint validation."""
        results = []
        for cid, func in self.constraints.items():
            res = execute_constraint_check(func, cid)
            results.append(res._asdict())
        
        telemetry = generate_z_telemetry()
        return {
            "status": "SUCCESS" if all(r['passed'] for r in results) else "DEGRADED",
            "constraints": results,
            "telemetry": telemetry
        }

    def update_state(self, new_state: Dict[str, Any]):
        """Updates the consciousness state if valid."""
        if validate_consciousness_state(new_state):
            self.state.update(new_state)
        else:
            self.logger.error("Invalid consciousness state update attempted.")

# Initialize global engine instance
z_engine = ZAgiEngine()

# Default constraints
z_engine.register_constraint("entropy_check", lambda: z_engine.state["entropy"] < 0.9)
z_engine.register_constraint("coherence_check", lambda: z_engine.state["coherence"] > 0.1)