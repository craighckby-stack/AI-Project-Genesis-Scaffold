"""
FIRST LEARNING AGI
==================

PURPOSE:
    Core engine for experiential/primitive learning cycles.
    This module serves as the primary entry point for the Grog simulation's 
    primitive learning capabilities, integrating diagnostic telemetry 
    to track learning efficiency and state evolution.

INTEGRATION:
    - Depends on 'agi_telemetry.py' for execution tracking.
    - Connects to the Grog simulation ecosystem for state persistence.
"""

import logging
from typing import Dict, Any
from .agi_telemetry import execute_learning_cycle

# Configure logging for the learning engine
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("FirstLearningAGI")

class PrimitiveLearningEngine:
    """
    Core engine responsible for executing primitive learning cycles.
    Maintains internal state and tracks evolution metrics.
    """
    def __init__(self):
        self.knowledge_base: Dict[str, Any] = {}
        self.cycle_count = 0

    def _primitive_logic(self) -> str:
        """Internal primitive logic for learning."""
        self.cycle_count += 1
        return f"Cycle {self.cycle_count} completed: Pattern recognized."

    def run_cycle(self, cycle_id: str) -> Dict[str, Any]:
        """
        Executes a single learning cycle with full telemetry instrumentation.
        """
        logger.info(f"Initiating learning cycle: {cycle_id}")
        
        report = execute_learning_cycle(cycle_id, self._primitive_logic)
        
        if report["success"]:
            self.knowledge_base[cycle_id] = report["result"]
            logger.info(f"Cycle {cycle_id} successful in {report['duration_ms']}ms")
        else:
            logger.error(f"Cycle {cycle_id} failed: {report.get('error')}")
            
        return report

def initialize_agi():
    """
    Factory function to initialize the learning engine.
    """
    engine = PrimitiveLearningEngine()
    logger.info("First Learning AGI initialized and ready for primitive cycles.")
    return engine

# Execution entry point for simulation integration
if __name__ == "__main__":
    agi = initialize_agi()
    agi.run_cycle("BOOTSTRAP_001")