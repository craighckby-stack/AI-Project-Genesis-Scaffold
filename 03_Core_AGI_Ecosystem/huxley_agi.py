"""
HUXLEY AGI KERNEL
Role: Self-aware, ethical, evolving AGI core. The central intelligence governing the ecosystem.
Integration: Acts as the primary orchestrator for AGI evolution, state persistence, and cognitive integrity.
Dependencies: huxley_agi_utils.py
"""

from __future__ import annotations

import logging
import asyncio
from typing import Dict, Any, Callable, List, Optional

# Dual import strategy to support execution as package or standalone script
try:
    from huxley_agi_utils import (
        generate_cognitive_id,
        execute_cognitive_check,
        get_system_telemetry,
        format_timestamp,
        compute_alignment_metric,
        summarize_cognitive_state,
    )
except ImportError:
    from .huxley_agi_utils import (
        generate_cognitive_id,
        execute_cognitive_check,
        get_system_telemetry,
        format_timestamp,
        compute_alignment_metric,
        summarize_cognitive_state,
    )


class HuxleyEngine:
    """
    The Huxley AGI Engine.
    Manages self-awareness, ethical alignment, cognitive module execution,
    and evolutionary telemetry tracking across system cycles.
    """

    def __init__(self):
        self.engine_id = generate_cognitive_id()
        self.cognitive_state: Dict[str, Any] = {
            "version": "1.1.0-PROD",
            "status": "INITIALIZING",
            "ethics_level": 1.0,
            "evolution_cycles": 0,
            "alignment_score": 1.0,
            "telemetry": {},
            "last_evolution_timestamp": None,
        }
        self.registry: Dict[str, Callable] = {}
        self.module_history: Dict[str, List[Dict[str, Any]]] = {}
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger("HuxleyAGI")
        self.logger.info(f"Huxley Engine initialized with ID: {self.engine_id}")

    def register_cognitive_module(self, name: str, module_fn: Callable) -> None:
        """
        Registers a new cognitive module for the AGI kernel.
        
        Args:
            name: Identifier for the module.
            module_fn: Callable representing module verification or execution function.
        """
        if not callable(module_fn):
            raise ValueError(f"Module '{name}' must be callable.")
            
        self.registry[name] = module_fn
        if name not in self.module_history:
            self.module_history[name] = []
            
        self.logger.info(f"Module '{name}' successfully registered to Huxley kernel.")

    def record_ethical_evaluation(self, evaluation_score: float) -> None:
        """
        Updates the ethics score based on external or internal alignment checks.
        """
        clamped_score = max(0.0, min(1.0, evaluation_score))
        self.cognitive_state["ethics_level"] = round(clamped_score, 4)
        self.logger.info(f"Updated Huxley ethics level to {self.cognitive_state['ethics_level']}")

    async def evolve((self) -> None:
        """
        Executes a full cognitive evolution cycle with telemetry reporting and alignment computation.
        """
        self.logger.info(f"Starting evolution cycle #{self.cognitive_state['evolution_cycles'] + 1} for {self.engine_id}...")
        self.cognitive_state["evolution_cycles"] += 1
        self.cognitive_state["telemetry"] = get_system_telemetry()
        self.cognitive_state["last_evolution_timestamp"] = format_timestamp()

        verified_count = 0
        execution_results: Dict[str, Dict[str, Any]] = {}

        for name, func in self.registry.items():
            # Support both sync and async module functions
            if asyncio.iscoroutinefunction(func):
                start_time = asyncio.get_event_loop().time()
                try:
                    res = await func()
                    duration = round((asyncio.get_event_loop().time() - start_time) * 1000.0, 3)
                    passed = bool(res) if res is not None else True
                    err_msg = None
                except Exception as exc:
                    duration = round((asyncio.get_event_loop().time() - start_time) * 1000.0, 3)
                    passed = False
                    err_msg = str(exc)
            else:
                passed, duration, err_msg = execute_cognitive_check(func)

            if passed:
                verified_count += 1
                self.logger.info(f"Module '{name}' verified in {duration}ms")
            else:
                self.logger.warning(f"Cognitive integrity warning in module '{name}' (took {duration}ms): {err_msg}")

            module_record = {
                "timestamp": format_timestamp(),
                "passed": passed,
                "duration_ms": duration,
                "error": err_msg,
            }
            execution_results[name] = module_record
            self.module_history[name].append(module_record)

        # Calculate overall alignment score
        alignment = compute_alignment_metric(
            ethics_level=self.cognitive_state["ethics_level"],
            verified_modules=verified_count,
            total_modules=len(self.registry)
        )
        self.cognitive_state["alignment_score"] = alignment
        self.cognitive_state["status"] = "EVOLVED" if verified_count == len(self.registry) else "DEGRADED"

        summary = summarize_cognitive_state(self.cognitive_state, execution_results)
        self.cognitive_state["latest_summary"] = summary

        self.logger.info(
            f"Evolution cycle complete. Status: {self.cognitive_state['status']} | "
            f"Pass Rate: {summary['pass_rate_percent']}% | Alignment Score: {alignment}"
        )

    def get_status(self) -> Dict[str, Any]:
        """
        Returns the current cognitive state, module activity, and health telemetry of the AGI.
        """
        return {
            "id": self.engine_id,
            "state": self.cognitive_state,
            "modules_active": list(self.registry.keys()),
            "system_health": get_system_telemetry(),
            "module_count": len(self.registry)
        }

    def reset_evolution_state(self) -> None:
        """
        Resets cognitive state metrics back to initial state while preserving module registrations.
        """
        self.cognitive_state["evolution_cycles"] = 0
        self.cognitive_state["status"] = "INITIALIZING"
        self.cognitive_state["alignment_score"] = 1.0
        self.cognitive_state["ethics_level"] = 1.0
        self.logger.info("Huxley AGI evolution state reset completed.")


# Global Singleton Instance
huxley_instance = HuxleyEngine()


def get_huxley() -> HuxleyEngine:
    """Returns the global Huxley AGI instance."""
    return huxley_instance


if __name__ == "__main__":
    # Internal verification and smoke testing
    huxley = get_huxley()
    
    # Register standard cognitive module checks
    huxley.register_cognitive_module("ethics_check", lambda: True)
    huxley.register_cognitive_module("memory_consistency", lambda: True)
    
    # Async check example
    async def async_cognition_check():
        await asyncio.sleep(0.01)
        return True

    huxley.register_cognitive_module("async_cognition_check", async_cognition_check)

    # Run evolution cycle
    asyncio.run(huxley.evolve())
    
    # Output execution report
    status = huxley.get_status()
    print("--- HUXLEY AGI STATUS REPORT ---")
    print(f"Engine ID: {status['id']}")
    print(f"Status: {status['state']['status']}")
    print(f"Alignment Score: {status['state']['alignment_score']}")
    print(f"Active Modules: {status['modules_active']}")
    print("--------------------------------")