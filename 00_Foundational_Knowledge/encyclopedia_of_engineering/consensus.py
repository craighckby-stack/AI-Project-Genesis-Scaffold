"""
Consensus Engine for Engineering Standards.
Applies game-theoretic Nash Equilibrium models to resolve conflicting engineering specifications.

Role: Provides deterministic consensus resolution for multi-agent engineering debates.
Integrations: 
- 00_Foundational_Knowledge/encyclopedia_of_engineering/__init__.py (Coordinator)
- 00_Foundational_Knowledge/theoretical_foundations/core_concepts.py (Conceptual Base)
"""

import math
import logging
import threading
from typing import List, Dict, Any

# Configure diagnostic logging for consensus friction tracking
logger = logging.getLogger("EngineeringConsensusResolver")

class EngineeringConsensusResolver:
    """
    Thread-safe resolver for engineering specification conflicts.
    Implements Nash Equilibrium models to minimize cognitive friction.
    """
    def __init__(self):
        self._lock = threading.RLock()

    def calculate_nash_equilibrium(self, values: List[float], weights: List[float]) -> Dict[str, float]:
        """
        Calculates the weighted consensus value and associated friction.
        Thread-safe implementation.
        """
        with self._lock:
            if not values or not weights or len(values) != len(weights):
                raise ValueError("Values and weights must be non-empty and of equal length.")
            
            total_weight = sum(weights)
            if total_weight == 0:
                weights = [1.0] * len(weights)
                total_weight = sum(weights)
                
            weighted_sum = sum(v * (w / total_weight) for v, w in zip(values, weights))
            
            # Compute deviation from weighted mean (Cognitive/Structural Friction)
            variance = sum(((v - weighted_sum) ** 2) * (w / total_weight) for v, w in zip(values, weights))
            friction = math.sqrt(variance)
            
            logger.debug(f"Consensus calculated: {weighted_sum}, Friction: {friction}")
            
            return {
                "consensus_value": round(weighted_sum, 6),
                "friction": round(friction, 4)
            }

    def calibrate_weights(self, sources: List[Dict[str, Any]], friction: float) -> List[Dict[str, Any]]:
        """
        Dynamically adjusts the reliability weights of engineering sources based on consensus friction.
        """
        with self._lock:
            calibrated = []
            for src in sources:
                weight = src.get("weight", 1.0)
                confidence = src.get("confidence", 1.0)
                bias = src.get("bias", 0.0)
                
                # Apply adaptive weight adjustment based on systemic friction
                if friction > 0.4:
                    adjustment = -0.05 * (1.0 if bias >= 0 else -1.0)
                else:
                    adjustment = 0.05 * confidence
                    
                new_weight = max(0.1, min(2.0, weight + adjustment))
                calibrated.append({**src, "weight": round(new_weight, 4)})
            
            logger.info(f"Source weights recalibrated. Friction threshold: {friction}")
            return calibrated