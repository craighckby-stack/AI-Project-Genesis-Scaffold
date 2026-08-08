"""
EULER TELEMETRY PROVIDER
Role: High-precision metric tracking and telemetry reporting for mathematical evolution steps.
Siphoned Pattern: Zero-Leak Diagnostic Engine from AI_Agent_OS.
"""

from __future__ import annotations
import time
from typing import Dict, Any, List

class EulerTelemetryProvider:
    """Manages telemetry data for the Euler Engine evolution cycles."""

    def __init__(self):
        self.start_time = time.time()
        self.total_evolutions = 0
        self.failed_evolutions = 0
        self.total_duration_ms = 0.0
        self.evolution_history: List[Dict[str, Any]] = []

    def record_evolution(self, theorem_id: str, duration_ms: float, success: bool):
        """Records metrics for a single evolution step."""
        self.total_evolutions += 1
        if not success:
            self.failed_evolutions += 1
        self.total_duration_ms += duration_ms
        
        # Maintain a rolling window of history (last 100 steps)
        self.evolution_history.append({
            "timestamp": time.time(),
            "theorem_id": theorem_id,
            "duration_ms": duration_ms,
            "success": success
        })
        if len(self.evolution_history) > 100:
            self.evolution_history.pop(0)

    def get_metrics(self) -> Dict[str, Any]:
        """Returns aggregated telemetry metrics."""
        uptime = time.time() - self.start_time
        avg_duration = (self.total_duration_ms / self.total_evolutions) if self.total_evolutions > 0 else 0.0
        success_rate = ((self.total_evolutions - self.failed_evolutions) / self.total_evolutions * 100) if self.total_evolutions > 0 else 100.0

        return {
            "uptime_seconds": round(uptime, 2),
            "total_evolutions": self.total_evolutions,
            "failed_evolutions": self.failed_evolutions,
            "success_rate": round(success_rate, 2),
            "avg_evolution_duration_ms": round(avg_duration, 4),
            "total_compute_time_ms": round(self.total_duration_ms, 2)
        }
