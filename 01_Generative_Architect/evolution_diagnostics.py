"""
EVOLUTION DIAGNOSTICS ENGINE
Role: Provides telemetry, metric computation, and diagnostic reporting for the evolution system.
Integration: Used by SelfEvolvingSystem to validate mutation cycles.
"""

from __future__ import annotations
import time
import datetime
from typing import Dict, Any, List

class EvolutionTelemetry:
    @staticmethod
    def get_timestamp() -> str:
        """Returns ISO 8601 formatted UTC timestamp."""
        return datetime.datetime.utcnow().isoformat() + 'Z'

    @staticmethod
    def compute_metrics(results: Dict[str, bool]) -> Dict[str, Any]:
        """Computes summary metrics for evolution diagnostic results."""
        total = len(results)
        passed = sum(1 for status in results.values() if status)
        failed = total - passed
        is_healthy = total > 0 and failed == 0
        
        return {
            'total': total,
            'passed': passed,
            'failed': failed,
            'is_healthy': is_healthy,
            'pass_rate': round((passed / total * 100), 2) if total > 0 else 0.0
        }

    @staticmethod
    def generate_report_metadata() -> Dict[str, Any]:
        """Generates standard telemetry metadata for diagnostic reports."""
        return {
            "engine_version": "1.0.0-EVO-CORE",
            "execution_time": time.time(),
            "system_state": "STABLE"
        }
