"""
================================================================================
ENCYCLOPEDIA OF ENGINEERING - CORE ENGINE
================================================================================
Role: Central coordinator for the Engineering Encyclopedia. Provides structured
access to engineering domains, resolves conflicting standards using game-theoretic
consensus models, and safely evaluates dynamic engineering formulas.

Connections:
- 00_Foundational_Knowledge/encyclopedia_of_engineering/consensus.py (Consensus Engine)
- 00_Foundational_Knowledge/encyclopedia_of_engineering/sandbox.py (Zero-Leak Sandbox)
================================================================================
"""

import threading
import time
from typing import Dict, Any, List, Optional

# Import siphoned architectural components from delegated files
from .consensus import EngineeringConsensusResolver
from .sandbox import ZeroLeakFormulaSandbox, FormulaExecutionTimeout

class EngineeringEncyclopedia:
    """
    The supreme coordinator for the Engineering Encyclopedia.
    Manages domain knowledge, resolves conflicting specifications, and executes formulas safely.
    """
    def __init__(self):
        self._lock = threading.RLock()
        self._sandbox = ZeroLeakFormulaSandbox()
        self._resolver = EngineeringConsensusResolver()
        
        # Pre-populate foundational engineering domains
        self._domains: Dict[str, Dict[str, Any]] = {
            "mechanical": {
                "description": "Mechanical engineering principles, thermodynamics, and fluid dynamics.",
                "formulas": {
                    "stress": "force / area",
                    "strain": "deformation / original_length",
                    "youngs_modulus": "stress / strain",
                    "carnot_efficiency": "1 - (tc / th)"
                },
                "standards": {
                    "safety_factor_structural": [1.5, 2.0, 2.5]
                }
            },
            "electrical": {
                "description": "Electrical engineering, electromagnetism, and circuit analysis.",
                "formulas": {
                    "ohms_law": "voltage / resistance",
                    "power_dc": "voltage * current",
                    "resonant_frequency": "1 / (2 * math.pi * math.sqrt(inductance * capacitance))"
                },
                "standards": {
                    "copper_wire_temp_coefficient": [0.00386, 0.00393, 0.00404]
                }
            },
            "civil": {
                "description": "Structural engineering, materials science, and geotechnical engineering.",
                "formulas": {
                    "concrete_compressive_strength": "load / area",
                    "bending_stress": "(bending_moment * distance_to_neutral_axis) / moment_of_inertia"
                },
                "standards": {
                    "concrete_safety_factor": [2.5, 3.0, 4.0]
                }
            }
        }

    def get_domain(self, domain_name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a specific engineering domain's metadata, formulas, and standards.
        """
        with self._lock:
            return self._domains.get(domain_name.lower())

    def register_domain(self, domain_name: str, data: Dict[str, Any]) -> None:
        """
        Registers or updates an engineering domain in a thread-safe manner.
        """
        with self._lock:
            self._domains[domain_name.lower()] = data

    def execute_formula(
        self, 
        domain_name: str, 
        formula_key: str, 
        variables: Dict[str, Any],
        timeout_sec: float = 2.0
    ) -> Any:
        """
        Safely executes an engineering formula retrieved from the encyclopedia.
        """
        domain = self.get_domain(domain_name)
        if not domain:
            raise ValueError(f"Domain '{domain_name}' not found in encyclopedia.")
            
        formula_str = domain.get("formulas", {}).get(formula_key)
        if not formula_str:
            raise ValueError(f"Formula '{formula_key}' not found in domain '{domain_name}'.")
            
        return self._sandbox.execute_formula(formula_str, variables, timeout_sec)

    def resolve_specification_conflict(
        self, 
        values: List[float], 
        weights: List[float]
    ) -> Dict[str, float]:
        """
        Resolves conflicting engineering specifications using game-theoretic Nash Equilibrium.
        """
        return self._resolver.calculate_nash_equilibrium(values, weights)

    def calibrate_source_weights(
        self, 
        sources: List[Dict[str, Any]], 
        friction: float
    ) -> List[Dict[str, Any]]:
        """
        Calibrates the reliability weights of engineering sources based on consensus friction.
        """
        return self._resolver.calibrate_weights(sources, friction)

    def clear_registry(self) -> None:
        """
        Purges the domain registry to prevent memory leaks during simulation resets.
        """
        with self._lock:
            self._domains.clear()

    def get_system_integrity_snapshot(self) -> Dict[str, Any]:
        """
        Returns a diagnostic snapshot of the encyclopedia state.
        """
        with self._lock:
            return {
                "timestamp": time.time(),
                "domain_count": len(self._domains),
                "domains": list(self._domains.keys()),
                "status": "OPERATIONAL"
            }

# Global instance for easy access across the application
encyclopedia = EngineeringEncyclopedia()