"""
Ethical Reasoning Engine
========================

PURPOSE:
    Reasoning framework for ethical AI alignment, constraint validation, 
    and moral decision-making telemetry.

ROLE:
    Acts as the primary gatekeeper for agentic actions, ensuring all 
    outputs align with core ethical constraints.

INTEGRATION:
    - Imports: ethical_reasoning_utils.py
    - Dependencies: 03_Core_AGI_Ecosystem/agi_ecosystem_diagnostics.py
"""

from __future__ import annotations
from typing import Dict, Any, Callable, List
from .ethical_reasoning_utils import (
    EthicalAlignmentResult, 
    calculate_alignment_score, 
    generate_reasoning_metadata,
    validate_ethical_constraint
)

class EthicalReasoningEngine:
    """
    Engine for evaluating the ethical validity of agentic decisions.
    Uses a registry-based approach to apply dynamic ethical constraints.
    """
    
    def __init__(self):
        self._constraints: Dict[str, Callable[[Any], bool]] = {}
        self._audit_log: List[Dict[str, Any]] = []

    def register_constraint(self, name: str, constraint_fn: Callable[[Any], bool]) -> None:
        """Registers a new ethical constraint check."""
        if validate_ethical_constraint(constraint_fn):
            self._constraints[name] = constraint_fn

    def evaluate(self, action_context: Any) -> EthicalAlignmentResult:
        """
        Evaluates an action against all registered ethical constraints.
        Returns an EthicalAlignmentResult containing the pass status and reasoning.
        """
        results = {}
        for name, constraint in self._constraints.items():
            results[name] = 1.0 if constraint(action_context) else 0.0
            
        score = calculate_alignment_score(results)
        passed = score >= 0.95  # Strict threshold for ethical alignment
        
        reasoning = "Alignment successful" if passed else "Ethical constraint violation detected"
        
        final_result = EthicalAlignmentResult(
            passed=passed,
            score=score,
            reasoning=reasoning,
            metadata=generate_reasoning_metadata()
        )
        
        self._audit_log.append(final_result._asdict())
        return final_result

    def get_audit_history(self) -> List[Dict[str, Any]]:
        """Returns the history of ethical evaluations."""
        return self._audit_log

# Global singleton instance for ecosystem-wide access
ethical_engine = EthicalReasoningEngine()