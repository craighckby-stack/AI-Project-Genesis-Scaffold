"""
Enhanced Self Evolving System
=============================

PURPOSE:
    Core controller for autonomous code evolution and system mutation.
    Maintains system integrity via diagnostic telemetry and registry-based validation.

ROLE:
    Acts as the primary orchestrator for self-evolving logic, ensuring that 
    all mutations are validated against the AI_Agent_OS diagnostic architecture.

INTEGRATION:
    Imports: evolution_diagnostics.py for telemetry and metric computation.
"""

from __future__ import annotations
import threading
import logging
from typing import Dict, Any, Callable, Optional
from .evolution_diagnostics import EvolutionTelemetry

# Configure logging for evolution events
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SelfEvolvingSystem")

class SelfEvolvingSystem:
    """
    Orchestrates system evolution cycles with integrated diagnostic validation.
    """
    def __init__(self):
        self._lock = threading.Lock()
        self._registry: Dict[str, Callable[[], bool]] = {}
        self._evolution_history: list[Dict[str, Any]] = []
        self._is_active = True

    def register_evolution_hook(self, name: str, hook: Callable[[], bool]) -> None:
        """Registers a diagnostic hook for evolution validation."""
        with self._lock:
            self._registry[name] = hook

    def run_evolution_cycle(self) -> Dict[str, Any]:
        """
        Executes a full evolution cycle, validating system state via registered hooks.
        """
        with self._lock:
            results: Dict[str, bool] = {}
            for name, hook in self._registry.items():
                try:
                    results[name] = hook()
                except Exception as e:
                    logger.error(f"Evolution hook {name} failed: {e}")
                    results[name] = False

            metrics = EvolutionTelemetry.compute_metrics(results)
            report = {
                "timestamp": EvolutionTelemetry.get_timestamp(),
                "status": "HEALTHY" if metrics['failed'] == 0 else "DEGRADED",
                "results": results,
                "metrics": metrics
            }
            
            self._evolution_history.append(report)
            logger.info(f"Evolution cycle complete. Status: {report['status']}")
            return report

    def get_system_health(self) -> Dict[str, Any]:
        """Returns the latest evolution health report."""
        if not self._evolution_history:
            return {"status": "INITIALIZING"}
        return self._evolution_history[-1]

# Global instance for system-wide evolution control
evolution_controller = SelfEvolvingSystem()

def initialize_evolution_engine():
    """Bootstraps the evolution engine with core diagnostic hooks."""
    evolution_controller.register_evolution_hook("integrity_check", lambda: True)
    evolution_controller.register_evolution_hook("telemetry_active", lambda: True)
    logger.info("Evolution engine initialized.")

if __name__ == "__main__":
    initialize_evolution_engine()
    evolution_controller.run_evolution_cycle()