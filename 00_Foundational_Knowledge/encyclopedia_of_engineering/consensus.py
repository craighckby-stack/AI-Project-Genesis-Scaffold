"""
Consensus Engine for Engineering Standards.
Applies game-theoretic Nash Equilibrium models to resolve conflicting engineering specifications.
"""
from typing import List, Dict, Any
import math

class EngineeringConsensusResolver:
    @staticmethod
    def calculate_nash_equilibrium(values: List[float], weights: List[float]) -> Dict[str, float]:
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
        
        return {
            "consensus_value": round(weighted_sum, 6),
            "friction": round(friction, 4)
        }

    @staticmethod
    def calibrate_weights(sources: List[Dict[str, Any]], friction: float) -> List[Dict[str, Any]]:
        """
        Dynamically adjusts the reliability weights of engineering sources based on consensus friction.
        If friction is high, damp extreme outliers; if low, boost high-confidence sources.
        """
        calibrated = []
        for src in sources:
            weight = src.get("weight", 1.0)
            confidence = src.get("confidence", 1.0)
            bias = src.get("bias", 0.0)
            
            if friction > 0.4:
                adjustment = -0.05 * (1.0 if bias >= 0 else -1.0)
            else:
                adjustment = 0.05 * confidence
                
            new_weight = max(0.1, min(2.0, weight + adjustment))
            calibrated.append({**src, "weight": round(new_weight, 4)})
        return calibrated
