"""
================================================================================
ENGINEERING CONSENSUS RESOLVER - CORE ENGINE
================================================================================
Role: Provides deterministic consensus resolution for multi-agent engineering 
      debates. Applies game-theoretic Nash Equilibrium models and outlier 
      suppression to resolve conflicting engineering specifications.

Connections:
- 00_Foundational_Knowledge/encyclopedia_of_engineering/__init__.py (Coordinator)
- 00_Foundational_Knowledge/theoretical_foundations/core_concepts.py (Conceptual Base)
- 00_Foundational_Knowledge/encyclopedia_of_engineering/consensus_telemetry.py (Telemetry)
================================================================================
"""

import math
import logging
import threading
import time
from typing import List, Dict, Any, Optional, Tuple

# Import siphoned telemetry bridge for high-fidelity observability
from .consensus_telemetry import ConsensusTelemetryBridge

# Configure diagnostic logging for consensus friction tracking
logger = logging.getLogger("EngineeringConsensusResolver")

class EngineeringConsensusResolver:
    """
    Thread-safe resolver for engineering specification conflicts.
    Implements Nash Equilibrium models to minimize cognitive and structural friction.
    Siphons 'Zero-Leak' and 'Adaptive Weighting' patterns from AetherForge-2.0.
    """
    def __init__(self):
        self._lock = threading.RLock()
        self._telemetry = ConsensusTelemetryBridge()
        self._history: List[Dict[str, Any]] = []
        logger.info("EngineeringConsensusResolver initialized: Nash Equilibrium mode active.")

    def calculate_nash_equilibrium(self, values: List[float], weights: List[float], outlier_threshold: float = 2.5) -> Dict[str, float]:
        """
        Calculates the weighted consensus value and associated friction.
        Includes an outlier suppression layer to protect system integrity.
        """
        with self._lock:
            if not values or not weights or len(values) != len(weights):
                raise ValueError("Values and weights must be non-empty and of equal length.")
            
            total_weight = sum(weights)
            if total_weight <= 0:
                weights = [1.0] * len(weights)
                total_weight = sum(weights)
                
            initial_weighted_sum = sum(v * (w / total_weight) for v, w in zip(values, weights))
            
            variance = sum(((v - initial_weighted_sum) ** 2) * (w / total_weight) for v, w in zip(values, weights))
            std_dev = math.sqrt(variance) if variance > 0 else 1e-9
            
            filtered_values = []
            filtered_weights = []
            
            for v, w in zip(values, weights):
                z_score = abs(v - initial_weighted_sum) / std_dev
                if z_score <= outlier_threshold:
                    filtered_values.append(v)
                    filtered_weights.append(w)
                else:
                    logger.warning(f"Consensus Outlier Suppressed: Value {v} (Z-Score: {z_score:.2f})")

            final_total_weight = sum(filtered_weights) if filtered_weights else total_weight
            final_values = filtered_values if filtered_values else values
            final_weights = filtered_weights if filtered_weights else weights
            
            consensus_value = sum(v * (w / final_total_weight) for v, w in zip(final_values, final_weights))
            final_variance = sum(((v - consensus_value) ** 2) * (w / final_total_weight) for v, w in zip(final_values, final_weights))
            friction = math.sqrt(final_variance)
            
            result = {
                "consensus_value": round(consensus_value, 6),
                "friction": round(friction, 4),
                "outliers_detected": len(values) - len(filtered_values),
                "timestamp": time.time()
            }
            
            self._telemetry.log_consensus_event("NASH_EQUILIBRIUM_RESOLVED", result)
            self._history.append(result)
            
            # Prune history to prevent memory leaks
            if len(self._history) > 1000:
                self._history.pop(0)
            
            return result

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
                
                if friction > 0.4:
                    adjustment = -0.08 * (1.0 if abs(bias) > 0.2 else 0.5)
                else:
                    adjustment = 0.05 * confidence
                    
                new_weight = max(0.1, min(2.5, weight + adjustment))
                calibrated.append({**src, "weight": round(new_weight, 4)})
            
            self._telemetry.log_consensus_event("WEIGHTS_RECALIBRATED", {"friction": friction, "source_count": len(sources)})
            return calibrated

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """
        Facilitates temporal debugging by returning a snapshot of the resolver's state.
        """
        with self._lock:
            return {
                "timestamp": time.time(),
                "history_depth": len(self._history),
                "last_result": self._history[-1] if self._history else None,
                "status": "OPERATIONAL"
            }

    def clear_registry(self) -> None:
        """
        Purges history to prevent memory leaks during simulation resets.
        """
        with self._lock:
            self._history.clear()
            logger.info("Consensus history registry cleared.")

    def verify_integrity(self) -> bool:
        """
        Performs a self-diagnostic check on the consensus engine.
        """
        with self._lock:
            if any(h.get("friction", 0) < 0 for h in self._history):
                logger.critical("Consensus Integrity Breach: Negative friction detected.")
                return False
            return True