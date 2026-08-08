"""
REGISTRY DIAGNOSTICS
Role: Telemetry and diagnostic reporting for the Knowledge Registry.
Integration: Used by registry_utils.py to provide audit-ready system state reports.
This module provides high-precision diagnostic checks and telemetry generation,
leveraging siphoned patterns from the AI_Agent_OS diagnostic engine.
"""

from __future__ import annotations
import time
from typing import Dict, Any, Callable
from .diagnostic_engine_utils import (
    format_timestamp,
    summarize_diagnostic_results,
    execute_check_with_telemetry
)

class RegistryDiagnosticEngine:
    """
    Core engine for executing and reporting on the health of the Knowledge Registry.
    """
    
    @staticmethod
    def generate_registry_telemetry(data_count: int, validator_count: int) -> Dict[str, Any]:
        """Generates standard telemetry metadata for registry audits."""
        return {
            "timestamp": format_timestamp(),
            "data_count": data_count,
            "validator_count": validator_count,
            "version": "1.1.0-REGISTRY-AWARE",
            "status": "HEALTHY" if data_count == validator_count else "DEGRADED"
        }

    @staticmethod
    def run_diagnostic_suite(checks: Dict[str, Callable[[], bool]]) -> Dict[str, Any]:
        """
        Executes a suite of diagnostic checks and returns a comprehensive report.
        
        :param checks: A dictionary of check names and their corresponding functions.
        :return: A structured report containing results, telemetry, and summary.
        """
        results = {}
        durations = {}
        
        for name, func in checks.items():
            passed, duration = execute_check_with_telemetry(func, name)
            results[name] = passed
            durations[name] = duration
            
        summary = summarize_diagnostic_results(results)
        
        return {
            "timestamp": format_timestamp(),
            "summary": summary,
            "details": {
                name: {"passed": results[name], "duration_ms": durations[name]}
                for name in results
            }
        }

def generate_registry_telemetry(data_count: int, validator_count: int) -> Dict[str, Any]:
    """Legacy wrapper for backward compatibility."""
    return RegistryDiagnosticEngine.generate_registry_telemetry(data_count, validator_count)