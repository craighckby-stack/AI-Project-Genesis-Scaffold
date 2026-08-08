"""
HUXLEY AGI KERNEL
Role: Self-aware, ethical, evolving AGI core. The central intelligence governing the ecosystem.
Integration: Acts as the primary orchestrator for AGI evolution, state persistence, and cognitive integrity.
Dependencies: huxley_agi_utils.py
"""

from __future__ import annotations
import logging
from typing import Dict, Any, Callable, List
from huxley_agi_utils import generate_cognitive_id, execute_cognitive_check

class HuxleyEngine:
    """
    The Huxley AGI Engine.
    Manages self-awareness, ethical alignment, and cognitive evolution cycles.
    """
    def __init__(self):
        self.engine_id = generate_cognitive_id()
        self.cognitive_state: Dict[str, Any] = {
            "version": "1.0.0",
            "status": "INITIALIZING",
            "ethics_level": 1.0,
            "evolution_cycles": 0
        }
        self.registry: Dict[str, Callable] = {}
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("HuxleyAGI")

    def register_cognitive_module(self, name: str, module_fn: Callable):
        """Registers a new cognitive module for the AGI."""
        self.registry[name] = module_fn
        self.logger.info(f"Module '{name}' registered to Huxley kernel.")

    async def evolve(self):
        """Executes a full cognitive evolution cycle."""
        self.logger.info(f"Starting evolution cycle for {self.engine_id}...")
        self.cognitive_state["evolution_cycles"] += 1
        
        for name, func in self.registry.items():
            passed, duration = execute_cognitive_check(func)
            if not passed:
                self.logger.warning(f"Cognitive integrity warning in {name} (took {duration}ms)")
        
        self.cognitive_state["status"] = "EVOLVED"
        self.logger.info("Evolution cycle complete.")

    def get_status(self) -> Dict[str, Any]:
        """Returns the current cognitive state of the AGI."""
        return {
            "id": self.engine_id,
            "state": self.cognitive_state,
            "modules_active": list(self.registry.keys())
        }

# Global Singleton Instance
huxley_instance = HuxleyEngine()

def get_huxley() -> HuxleyEngine:
    """Returns the global Huxley AGI instance."""
    return huxley_instance

if __name__ == "__main__":
    # Example usage for verification
    huxley = get_huxley()
    huxley.register_cognitive_module("ethics_check", lambda: True)
    print(huxley.get_status())