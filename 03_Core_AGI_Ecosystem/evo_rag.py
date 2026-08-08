"""
EVO RAG ENGINE
Role: Core RAG engine + GitHub universe explorer.
Integration: Connects to system modules for real-time retrieval and evolution monitoring.
Dependencies: evo_rag_utils.py, diagnostic_engine_utils.py (via siphoned patterns)

This engine manages the retrieval-augmented generation lifecycle, incorporating 
diagnostic telemetry and registry-based state management for high-fidelity 
evolutionary tracking.
"""

from __future__ import annotations
import datetime
from typing import Dict, Any, Callable, List
from .evo_rag_utils import (
    execute_rag_step_with_telemetry, 
    validate_rag_schema,
    format_timestamp
)

class EvoRagEngine:
    """
    EvoRagEngine manages the retrieval-augmented generation lifecycle,
    incorporating diagnostic telemetry and registry-based state management.
    """

    def __init__(self):
        self.registry: Dict[str, Callable] = {}
        self.initialized_at = format_timestamp()
        self.execution_history: List[Dict[str, Any]] = []

    def register_step(self, name: str, step_fn: Callable):
        """Registers a custom RAG step for the evolution pipeline."""
        self.registry[name] = step_fn

    async def execute_pipeline(self, query: str) -> Dict[str, Any]:
        """
        Executes the RAG pipeline with integrated telemetry and schema validation.
        """
        report = {
            "query": query,
            "timestamp": format_timestamp(),
            "steps": {},
            "status": "SUCCESS",
            "metadata": {"version": "2.0.0-EVO-RAG"}
        }

        # Execution of registered steps
        for name, step_fn in self.registry.items():
            result, duration = execute_rag_step_with_telemetry(step_fn, name)
            
            is_valid = validate_rag_schema(result) if isinstance(result, dict) else False
            
            report["steps"][name] = {
                "result": result,
                "duration_ms": duration,
                "schema_valid": is_valid
            }
            
            if not is_valid:
                report["status"] = "DEGRADED"

        self.execution_history.append(report)
        return report

    def get_status(self) -> Dict[str, Any]:
        """Returns the current state and health metrics of the RAG engine."""
        return {
            "initialized_at": self.initialized_at,
            "registered_steps": list(self.registry.keys()),
            "history_count": len(self.execution_history),
            "status": "HEALTHY" if len(self.execution_history) == 0 or self.execution_history[-1]["status"] == "SUCCESS" else "DEGRADED"
        }

# Global instance for system-wide access
evo_rag_instance = EvoRagEngine()

def get_evo_rag() -> EvoRagEngine:
    """Accessor for the global EvoRagEngine instance."""
    return evo_rag_instance